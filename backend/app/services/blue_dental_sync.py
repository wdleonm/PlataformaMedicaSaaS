import json
import logging
from datetime import datetime, timezone
import requests
from sqlmodel import Session, select

from app.database import engine
from app.models.catalogo_insumo import CatalogoInsumo
from app.services.bcv_service import BCVService

logger = logging.getLogger(__name__)

def sync_bluedental_catalogo():
    """
    Sincroniza los insumos desde BlueDental a la tabla CatalogoInsumo.
    Usa la API REST pública de WooCommerce (store/products).
    """
    try:
        bcv_rate = BCVService.sync_bcv()
    except Exception as e:
        logger.error(f"No se pudo sincronizar el BCV para correr el scraper: {e}")
        bcv_rate = None

    if not bcv_rate:
        logger.warning("No hay tasa BCV, los precios USD podrían no estar actualizados.")
        # Se podría usar la última tasa, pero asumiremos fallback a 1 si algo falla crítico, u obtener de BD
        # Para ser seguros, traemos la última válida:
        with Session(engine) as session:
            from app.models.config_global import ConfiguracionGlobal
            config = session.exec(select(ConfiguracionGlobal)).first()
            if config and config.tasa_usd:
                bcv_rate = config.tasa_usd
            else:
                bcv_rate = 45.0  # fallback

    base_url = "https://bluedentalvzla.com/wp-json/wc/store/products"
    page = 1
    per_page = 50
    total_synced = 0

    with Session(engine) as session:
        while True:
            try:
                url = f"{base_url}?page={page}&per_page={per_page}"
                headers = {'User-Agent': 'Mozilla/5.0 PlataformaMedicaSaaS Sync'}
                resp = requests.get(url, headers=headers, timeout=15)
                
                if resp.status_code != 200:
                    break
                
                products = resp.json()
                if not products:
                    break
                
                for prod in products:
                    sku = prod.get("sku", "")
                    name = prod.get("name", "")
                    if not name:
                        continue
                        
                    sku = sku if sku else None
                    
                    # Calcular precio
                    price_data = prod.get("prices", {})
                    raw_price_str = price_data.get("price", "0")
                    minor_unit = price_data.get("currency_minor_unit", 2)
                    
                    # Dividir para obtener valor real
                    try:
                        real_price_ves = float(raw_price_str) / (10 ** minor_unit)
                    except ValueError:
                        real_price_ves = 0.0
                    
                    precio_usd = round(real_price_ves / bcv_rate, 2) if bcv_rate > 0 else 0.0

                    imagen_url = None
                    images = prod.get("images", [])
                    if images:
                        imagen_url = images[0].get("src")
                    
                    cats = prod.get("categories", [])
                    categoria_str = cats[0].get("name") if cats else "Odontología"

                    permalink = prod.get("permalink")

                    # DETECTAR UNIDADES DESDE EL NOMBRE (ej: "Caja x 50", "x 100")
                    import re
                    unidades_detectadas = 1
                    # Buscar patrones como "x 50", "x 100", "X 50", "x50"
                    match = re.search(r'[xX]\s?(\d+)', name)
                    if match:
                        unidades_detectadas = int(match.group(1))
                    elif "docena" in name.lower():
                        unidades_detectadas = 12

                    # Upsert
                    stmt = select(CatalogoInsumo)
                    if sku:
                        stmt = stmt.where(CatalogoInsumo.sku == sku)
                    else:
                        stmt = stmt.where(CatalogoInsumo.nombre == name)
                    
                    existente = session.exec(stmt).first()
                    
                    if existente:
                        existente.nombre = name
                        existente.categoria = categoria_str
                        existente.precio_usd = precio_usd
                        existente.unidades = unidades_detectadas
                        existente.imagen_url = imagen_url
                        existente.enlace_origen = permalink
                        existente.updated_at = datetime.now(timezone.utc)
                        existente.sku = sku
                    else:
                        nuevo = CatalogoInsumo(
                            sku=sku,
                            nombre=name,
                            categoria=categoria_str,
                            precio_usd=precio_usd,
                            unidades=unidades_detectadas,
                            imagen_url=imagen_url,
                            enlace_origen=permalink
                        )
                        session.add(nuevo)
                    
                    total_synced += 1
                
                session.commit()
                page += 1
                
            except Exception as e:
                logger.error(f"Error sincronizando pagina {page} de BlueDental: {e}")
                session.rollback()
                break
                
    return total_synced
