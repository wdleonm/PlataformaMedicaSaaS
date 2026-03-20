import httpx
from bs4 import BeautifulSoup
import re

async def fetch_bcv_rates():
    """
    Obtiene las tasas de cambio oficiales desde la web del BCV.
    Retorna un dict con {'USD': float, 'EUR': float} o lanza una excepción.
    """
    url = "https://www.bcv.org.ve/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }
    
    try:
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            rates = {}
            
            # IDs típicos en el BCV
            # Dólar (USD)
            dolar_container = soup.find('div', id='dolar')
            if dolar_container:
                val_element = dolar_container.find('strong')
                if val_element:
                    val_text = val_element.text.strip()
                    # Limpiamos: removemos puntos de miles y cambiamos coma por punto decimal
                    # Ejemplo: "1.234,56" -> "1234.56"
                    clean_val = val_text.replace('.', '').replace(',', '.')
                    rates['USD'] = float(clean_val)
            
            # Euro (EUR)
            euro_container = soup.find('div', id='euro')
            if euro_container:
                val_element = euro_container.find('strong')
                if val_element:
                    val_text = val_element.text.strip()
                    clean_val = val_text.replace('.', '').replace(',', '.')
                    rates['EUR'] = float(clean_val)
                
            if not rates:
                print("BCV Scraper: No se encontraron los contenedores de tasas esperados.")
                
            return rates
            
    except Exception as e:
        print(f"Error fetching BCV rates: {e}")
        return None
