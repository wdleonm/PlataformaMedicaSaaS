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
                val_text = dolar_container.find('strong').text.strip()
                rates['USD'] = float(val_text.replace(',', '.'))
            
            # Euro (EUR)
            euro_container = soup.find('div', id='euro')
            if euro_container:
                val_text = euro_container.find('strong').text.strip()
                rates['EUR'] = float(val_text.replace(',', '.'))
                
            return rates
            
    except Exception as e:
        print(f"Error fetching BCV rates: {e}")
        return None
