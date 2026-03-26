import urllib.request
from bs4 import BeautifulSoup
import re

url = 'https://bluedentalvzla.com/categoria-productos/insumos-odontologicos/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

soup = BeautifulSoup(html, 'lxml')
# Elementor WooCommerce products usually have class "product"
products = soup.find_all('div', class_=re.compile(r'\bproduct\b'))
if not products:
    products = soup.find_all('li', class_=re.compile(r'\bproduct\b'))

print(f"Encontrados {len(products)} productos.")

for i, p in enumerate(products[:3]):
    title_elem = p.find(['h2', 'h3'], class_=re.compile(r'woocommerce-loop-product__title|title'))
    title = title_elem.text.strip() if title_elem else "Sin titulo"
    
    price_elem = p.find('span', class_='price')
    price = price_elem.text.strip() if price_elem else "Sin precio"
    
    img_elem = p.find('img')
    img = img_elem['src'] if img_elem and 'src' in img_elem.attrs else "Sin imagen"
    
    link_elem = p.find('a')
    link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else "Sin link"
    
    print(f"[{i}] {title} | {price} | {img} | {link}")
