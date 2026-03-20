import asyncio
import httpx
from bs4 import BeautifulSoup

async def test_bcv():
    url = "https://www.bcv.org.ve/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.get(url, headers=headers, timeout=30.0)
            print(f"Status: {response.status_code}")
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Intentar encontrar USD
            dolar = soup.find('div', id='dolar')
            if dolar:
                val = dolar.find('strong')
                print(f"USD raw: {val.text if val else 'No strong found'}")
            else:
                print("No div id='dolar' found")
                
            # Intentar encontrar EUR
            euro = soup.find('div', id='euro')
            if euro:
                val = euro.find('strong')
                print(f"EUR raw: {val.text if val else 'No strong found'}")
            else:
                print("No div id='euro' found")
                
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_bcv())
