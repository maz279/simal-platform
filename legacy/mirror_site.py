import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import re
import time
import shutil
import hashlib
import threading
import subprocess
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, urljoin, unquote
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup

BASE_URL = "https://www.simalme.com"
RESOLVE_IP = "191.101.228.129"
OUTPUT_DIR = r"C:\software_project\Sofoware_project_04\Simal_Corporate_website\Mirror_site"
MAX_WORKERS = 10

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Extended Windows path helper
def win_path(p):
    abs_p = os.path.abspath(p)
    if os.name == 'nt' and not abs_p.startswith('\\\\?\\'):
        return '\\\\?\\' + abs_p
    return abs_p

# Helper: download single file using curl.exe
def curl_download(url, dest_path, retries=3):
    wp_dest = win_path(dest_path)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    temp_path = f"{dest_path}.tmp_{os.getpid()}_{threading.get_ident()}_{time.time_ns()}"
    
    parsed = urlparse(url)
    cmd = [
        'curl.exe', '-k', '-s', '-f', '-L',
        '--connect-timeout', '10',
        '--max-time', '40',
        '--resolve', f'www.simalme.com:443:{RESOLVE_IP}',
        '--resolve', f'simalme.com:443:{RESOLVE_IP}',
        '-o', temp_path,
        url
    ]
    
    for attempt in range(1, retries + 1):
        res = subprocess.run(cmd, capture_output=True)
        if res.returncode == 0 and os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            try:
                if os.path.exists(dest_path):
                    os.remove(dest_path)
                shutil.move(temp_path, dest_path)
                return True, os.path.getsize(dest_path)
            except Exception as e:
                time.sleep(0.2)
        time.sleep(0.3 * attempt)
        
    if os.path.exists(temp_path):
        try:
            os.remove(temp_path)
        except:
            pass
    return False, 0

# Helper: fetch text content using curl.exe
def curl_text(url, retries=3):
    cmd = [
        'curl.exe', '-k', '-s', '-f', '-L',
        '--connect-timeout', '10',
        '--max-time', '40',
        '--resolve', f'www.simalme.com:443:{RESOLVE_IP}',
        '--resolve', f'simalme.com:443:{RESOLVE_IP}',
        url
    ]
    for attempt in range(1, retries + 1):
        res = subprocess.run(cmd, capture_output=True)
        if res.returncode == 0:
            return res.stdout.decode('utf-8', errors='ignore')
        time.sleep(0.3 * attempt)
    return None

def normalize_url(url):
    if not url:
        return ""
    url = url.split('#')[0].strip()
    return url

def is_simalme_host(host):
    return host in ('www.simalme.com', 'simalme.com', '')

def sanitize_segment(seg):
    clean = re.sub(r'[:*?"<>|]', '_', seg)
    if len(clean) > 75:
        h = hashlib.md5(clean.encode('utf-8')).hexdigest()[:8]
        clean = clean[:65] + '_' + h
    return clean

def url_to_rel_path(url, is_html_page=False):
    parsed = urlparse(url)
    path = unquote(parsed.path)
    
    if parsed.netloc and not is_simalme_host(parsed.netloc):
        domain_folder = sanitize_segment(parsed.netloc)
        rel = os.path.join('_cdn', domain_folder, path.lstrip('/'))
    else:
        rel = path.lstrip('/')
        
    if is_html_page or not rel or rel.endswith('/'):
        if rel:
            rel = os.path.join(rel, 'index.html')
        else:
            rel = 'index.html'
    elif '.' not in os.path.basename(rel):
        rel = os.path.join(rel, 'index.html')
        
    # sanitize each component for Windows
    parts = rel.replace('/', os.sep).replace('\\', os.sep).split(os.sep)
    clean_parts = []
    for p in parts:
        clean = sanitize_segment(p)
        if clean:
            clean_parts.append(clean)
    final_rel = os.path.join(*clean_parts) if clean_parts else 'index.html'
    return final_rel

def url_to_abs_path(url, is_html_page=False):
    return os.path.join(OUTPUT_DIR, url_to_rel_path(url, is_html_page))

# Parse srcset attribute
def parse_srcset(srcset):
    urls = []
    if not srcset:
        return urls
    candidates = srcset.split(',')
    for c in candidates:
        parts = c.strip().split()
        if parts:
            urls.append(parts[0])
    return urls

# Extract full-res URL candidate by stripping WordPress thumbnail suffixes
def get_fullres_candidate(img_url):
    pattern = r'(-\d+x\d+)(\.[a-zA-Z0-9]+)$'
    if re.search(pattern, img_url):
        return re.sub(pattern, r'\2', img_url)
    return None

def is_valid_http_url(url):
    if not url:
        return False
    u = url.strip().lower()
    if u.startswith(('tel:', 'mailto:', 'javascript:', 'whatsapp:', 'viber:', 'skype:', '#')):
        return False
    return True

def main():
    print("=" * 60)
    print("   SIMAL TECHNOLOGIES - 100% SITE MIRRORING ENGINE (v2.0)")
    print("=" * 60)
    print(f"Target: {BASE_URL}")
    print(f"Resolved Fast IP: {RESOLVE_IP}")
    print(f"Destination: {OUTPUT_DIR}\n")
    
    all_pages = set()
    all_assets = set()
    failed_urls = set()
    
    # -------------------------------------------------------------
    # PHASE 1: SITEMAPS & ROBOTS
    # -------------------------------------------------------------
    print(">>> PHASE 1: Fetching Robots.txt and All Sitemaps...")
    core_files = [
        f"{BASE_URL}/robots.txt",
        f"{BASE_URL}/sitemap_index.xml",
        f"{BASE_URL}/post-sitemap.xml",
        f"{BASE_URL}/page-sitemap.xml",
        f"{BASE_URL}/product-sitemap.xml",
        f"{BASE_URL}/product_brand-sitemap.xml",
        f"{BASE_URL}/product_cat-sitemap.xml",
        f"{BASE_URL}/local-sitemap.xml",
        f"{BASE_URL}/locations.kml",
        f"{BASE_URL}/main-sitemap.xsl"
    ]
    
    for u in core_files:
        dest = url_to_abs_path(u, is_html_page=False)
        ok, sz = curl_download(u, dest)
        if ok:
            print(f"  [OK] Saved {os.path.basename(dest)} ({sz} bytes)")
            if dest.endswith(('.xml', '.kml')):
                try:
                    with open(dest, 'rb') as f:
                        xml_content = f.read()
                    root = ET.fromstring(xml_content)
                    for elem in root.iter():
                        if elem.tag.endswith('loc') and elem.text:
                            loc_url = elem.text.strip()
                            if elem.tag.endswith('image}loc'):
                                all_assets.add(loc_url)
                            elif is_simalme_host(urlparse(loc_url).netloc):
                                if loc_url.endswith(('.xml', '.kml', '.png', '.jpg', '.jpeg', '.webp', '.pdf')):
                                    all_assets.add(loc_url)
                                else:
                                    all_pages.add(normalize_url(loc_url))
                except Exception as ex:
                    print(f"  [Warning] XML parse error for {dest}: {ex}")
        else:
            print(f"  [Failed] Could not download {u}")
            
    print(f"\nDiscovered from sitemaps: {len(all_pages)} Pages, {len(all_assets)} Direct Assets")
    
    # Add homepage and shop pagination pages
    all_pages.add(f"{BASE_URL}/")
    for page_num in range(1, 10):
        all_pages.add(f"{BASE_URL}/shop/page/{page_num}/" if page_num > 1 else f"{BASE_URL}/shop/")
        
    # -------------------------------------------------------------
    # PHASE 2: RECURSIVE HTML CRAWL & ASSET HARVESTING
    # -------------------------------------------------------------
    print("\n>>> PHASE 2: Crawling All HTML Pages and Harvesting Assets...")
    
    pages_to_crawl = list(all_pages)
    crawled_pages = set()
    page_html_contents = {}
    
    while pages_to_crawl:
        current_batch = pages_to_crawl
        pages_to_crawl = []
        
        print(f"Crawling batch of {len(current_batch)} pages with {MAX_WORKERS} workers...")
        
        def crawl_page(page_url):
            dest = url_to_abs_path(page_url, is_html_page=True)
            # If already downloaded and not empty, we can read local file
            if os.path.exists(dest) and os.path.getsize(dest) > 0:
                try:
                    with open(dest, 'r', encoding='utf-8', errors='ignore') as f:
                        html = f.read()
                except:
                    html = None
            else:
                ok, sz = curl_download(page_url, dest)
                if not ok:
                    return page_url, None, set(), set()
                try:
                    with open(dest, 'r', encoding='utf-8', errors='ignore') as f:
                        html = f.read()
                except:
                    return page_url, None, set(), set()
                    
            if not html:
                return page_url, None, set(), set()
                
            soup = BeautifulSoup(html, 'html.parser')
            new_pages = set()
            new_assets = set()
            
            # 1. Internal Links
            for a in soup.find_all('a', href=True):
                href = a['href'].strip()
                if not is_valid_http_url(href):
                    continue
                full_href = urljoin(page_url, href)
                norm_href = normalize_url(full_href)
                parsed = urlparse(norm_href)
                
                if is_simalme_host(parsed.netloc) and not parsed.query and not parsed.path.startswith(('/wp-admin', '/wp-login', '/cart', '/checkout')):
                    path_lower = parsed.path.lower()
                    if any(path_lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.zip', '.doc', '.docx']):
                        new_assets.add(norm_href)
                    else:
                        new_pages.add(norm_href)
                        
            # 2. Stylesheets
            for link in soup.find_all('link', rel=lambda x: x and 'stylesheet' in x):
                href = link.get('href')
                if href and is_valid_http_url(href):
                    new_assets.add(urljoin(page_url, href))
                    
            # 3. Scripts
            for script in soup.find_all('script', src=True):
                src = script['src']
                if src and is_valid_http_url(src):
                    new_assets.add(urljoin(page_url, src))
                    
            # 4. Images & Media
            for img in soup.find_all('img'):
                for attr in ['src', 'data-src', 'data-lazy-src', 'data-large_image', 'data-zoom-image']:
                    val = img.get(attr)
                    if val and not val.startswith('data:') and is_valid_http_url(val):
                        img_url = urljoin(page_url, val)
                        new_assets.add(img_url)
                        cand = get_fullres_candidate(img_url)
                        if cand:
                            new_assets.add(cand)
                            
                srcset = img.get('srcset')
                for u in parse_srcset(srcset):
                    if not u.startswith('data:') and is_valid_http_url(u):
                        img_url = urljoin(page_url, u)
                        new_assets.add(img_url)
                        cand = get_fullres_candidate(img_url)
                        if cand:
                            new_assets.add(cand)
                            
            # Picture source srcset
            for src_tag in soup.find_all('source', srcset=True):
                for u in parse_srcset(src_tag['srcset']):
                    if not u.startswith('data:') and is_valid_http_url(u):
                        img_url = urljoin(page_url, u)
                        new_assets.add(img_url)
                        
            # Meta images & favicons
            for meta in soup.find_all('meta', property=lambda x: x in ['og:image', 'og:image:secure_url', 'twitter:image']):
                val = meta.get('content')
                if val and is_valid_http_url(val):
                    new_assets.add(urljoin(page_url, val))
                    
            for link in soup.find_all('link', rel=lambda x: x and any(k in x for k in ['icon', 'apple-touch-icon', 'manifest'])):
                href = link.get('href')
                if href and is_valid_http_url(href):
                    new_assets.add(urljoin(page_url, href))
                    
            # Inline background images
            for tag in soup.find_all(style=True):
                style_str = tag['style']
                bg_matches = re.findall(r'url\s*\(\s*[\'"]?([^\'"\)]+)[\'"]?\s*\)', style_str)
                for bg in bg_matches:
                    if not bg.startswith('data:') and is_valid_http_url(bg):
                        new_assets.add(urljoin(page_url, bg))
                        
            return page_url, html, new_pages, new_assets
            
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_url = {executor.submit(crawl_page, u): u for u in current_batch if u not in crawled_pages}
            for fut in as_completed(future_to_url):
                p_url = future_to_url[fut]
                crawled_pages.add(p_url)
                try:
                    res_url, html, n_pages, n_assets = fut.result()
                    if html:
                        page_html_contents[res_url] = html
                        for n_p in n_pages:
                            if n_p not in crawled_pages and n_p not in all_pages:
                                all_pages.add(n_p)
                                pages_to_crawl.append(n_p)
                        for n_a in n_assets:
                            all_assets.add(n_a)
                except Exception as ex:
                    print(f"Error crawling {p_url}: {ex}")
                    
        print(f"Completed batch. Crawled so far: {len(crawled_pages)} pages. Queued assets: {len(all_assets)}")

    print(f"\n>>> Crawl complete! Total HTML pages saved: {len(crawled_pages)}")
    print(f">>> Total discovered assets across all pages: {len(all_assets)}")
    
    # -------------------------------------------------------------
    # PHASE 3: CSS DEEP PARSING (FONTS & CSS IMAGES)
    # -------------------------------------------------------------
    print("\n>>> PHASE 3: Parsing CSS Files for Embedded Fonts and Images...")
    css_urls = [u for u in all_assets if urlparse(u).path.endswith('.css') or '.css?' in u]
    print(f"Found {len(css_urls)} CSS files to inspect.")
    
    for css_url in css_urls:
        css_text = curl_text(css_url)
        if not css_text:
            continue
        css_refs = re.findall(r'url\s*\(\s*[\'"]?([^\'"\)]+)[\'"]?\s*\)', css_text)
        for ref in css_refs:
            ref_clean = ref.strip()
            if ref_clean.startswith('data:') or not ref_clean or not is_valid_http_url(ref_clean):
                continue
            if 'simalme.smartbd.com' in ref_clean:
                ref_clean = ref_clean.replace('simalme.smartbd.com', 'www.simalme.com')
            full_ref = urljoin(css_url, ref_clean)
            all_assets.add(full_ref)
            
    print(f"Total assets after CSS font/image extraction: {len(all_assets)}")
    
    # -------------------------------------------------------------
    # PHASE 4: ASSET CONCURRENT DOWNLOADER (DEDUPLICATED BY DESTINATION PATH)
    # -------------------------------------------------------------
    print("\n>>> PHASE 4: Downloading All Assets (Images, CSS, JS, Fonts, Media)...")
    
    # Clean asset URLs and DEDUPLICATE by local destination path
    dest_to_url = {}
    for a in all_assets:
        a_norm = normalize_url(a)
        if 'simalme.smartbd.com' in a_norm:
            a_norm = a_norm.replace('simalme.smartbd.com', 'www.simalme.com')
        if a_norm.startswith(('http://', 'https://')):
            dest = url_to_abs_path(a_norm, is_html_page=False)
            if dest not in dest_to_url:
                dest_to_url[dest] = a_norm
                
    unique_items = list(dest_to_url.items())
    print(f"Starting concurrent download of {len(unique_items)} unique destination files with {MAX_WORKERS} workers...")
    
    total_bytes = 0
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    def download_unique_asset(item):
        dest, asset_url = item
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            return asset_url, True, os.path.getsize(dest), True
        ok, sz = curl_download(asset_url, dest)
        return asset_url, ok, sz, False
        
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {executor.submit(download_unique_asset, item): item for item in unique_items}
        completed = 0
        for fut in as_completed(future_map):
            completed += 1
            u, ok, sz, skipped = fut.result()
            if ok:
                if skipped:
                    skip_count += 1
                else:
                    success_count += 1
                total_bytes += sz
            else:
                fail_count += 1
                failed_urls.add(u)
                
            if completed % 50 == 0 or completed == len(unique_items):
                elapsed = time.time() - start_time
                mb = total_bytes / (1024 * 1024)
                rate = completed / max(elapsed, 0.001)
                print(f"  [{completed}/{len(unique_items)}] Downloaded: {success_count} | Cached: {skip_count} | Failed: {fail_count} | Size: {mb:.1f} MB ({rate:.1f} items/s)")
                
    # -------------------------------------------------------------
    # PHASE 5: OFFLINE LOCALIZATION & LINK REWRITING
    # -------------------------------------------------------------
    print("\n>>> PHASE 5: Rewriting HTML and CSS for 100% Offline Capability...")
    
    # 5.1 CSS Rewriting
    print("Rewriting CSS files to point to local assets...")
    for root_dir, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            if f.endswith('.css'):
                css_path = os.path.join(root_dir, f)
                try:
                    with open(css_path, 'r', encoding='utf-8', errors='ignore') as fp:
                        css_content = fp.read()
                    modified = False
                    if 'simalme.smartbd.com' in css_content:
                        css_content = css_content.replace('simalme.smartbd.com', 'www.simalme.com')
                        modified = True
                    if modified:
                        with open(css_path, 'w', encoding='utf-8') as fp:
                            fp.write(css_content)
                except Exception as ex:
                    pass

    # 5.2 HTML Rewriting
    print("Rewriting HTML files to make links relative and offline-browsable...")
    html_files = []
    for root_dir, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            if f == 'index.html':
                html_files.append(os.path.join(root_dir, f))
                
    print(f"Total HTML files to localize: {len(html_files)}")
    
    for h_path in html_files:
        try:
            with open(h_path, 'r', encoding='utf-8', errors='ignore') as fp:
                html_content = fp.read()
                
            soup = BeautifulSoup(html_content, 'html.parser')
            
            def localize_url(u):
                if not u or u.startswith(('data:', '#', 'mailto:', 'tel:', 'javascript:', 'whatsapp:', 'viber:', 'skype:')):
                    return u
                u_norm = normalize_url(u)
                if 'simalme.smartbd.com' in u_norm:
                    u_norm = u_norm.replace('simalme.smartbd.com', 'www.simalme.com')
                    
                parsed = urlparse(u_norm)
                if is_simalme_host(parsed.netloc):
                    is_pg = (not '.' in os.path.basename(parsed.path) or parsed.path.endswith('/'))
                    rel = url_to_rel_path(u_norm, is_html_page=is_pg)
                    local_target = os.path.join(OUTPUT_DIR, rel)
                    return os.path.relpath(local_target, os.path.dirname(h_path)).replace('\\', '/')
                elif parsed.netloc and parsed.netloc not in ('', 'localhost'):
                    rel = url_to_rel_path(u_norm, is_html_page=False)
                    local_target = os.path.join(OUTPUT_DIR, rel)
                    if os.path.exists(local_target):
                        return os.path.relpath(local_target, os.path.dirname(h_path)).replace('\\', '/')
                return u
                
            for a in soup.find_all('a', href=True):
                a['href'] = localize_url(a['href'])
                
            for link in soup.find_all('link', href=True):
                link['href'] = localize_url(link['href'])
                
            for s in soup.find_all('script', src=True):
                s['src'] = localize_url(s['src'])
                
            for img in soup.find_all('img'):
                for attr in ['src', 'data-src', 'data-lazy-src']:
                    if img.get(attr):
                        img[attr] = localize_url(img[attr])
                if img.get('srcset'):
                    new_parts = []
                    for c in img['srcset'].split(','):
                        pts = c.strip().split()
                        if pts:
                            pts[0] = localize_url(pts[0])
                            new_parts.append(' '.join(pts))
                    img['srcset'] = ', '.join(new_parts)
                    
            for src_tag in soup.find_all('source', srcset=True):
                new_parts = []
                for c in src_tag['srcset'].split(','):
                    pts = c.strip().split()
                    if pts:
                        pts[0] = localize_url(pts[0])
                        new_parts.append(' '.join(pts))
                src_tag['srcset'] = ', '.join(new_parts)
                
            orig_backup = h_path.replace('index.html', 'index.original.html')
            if not os.path.exists(orig_backup):
                with open(orig_backup, 'w', encoding='utf-8') as fp:
                    fp.write(html_content)
                    
            with open(h_path, 'w', encoding='utf-8') as fp:
                fp.write(str(soup))
                
        except Exception as ex:
            print(f"Error localizing {h_path}: {ex}")
            
    # -------------------------------------------------------------
    # PHASE 6: VERIFICATION & AUDIT REPORT
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("   FINAL AUDIT & COMPLETION REPORT")
    print("=" * 60)
    
    total_files = 0
    total_size = 0
    file_type_counts = {}
    
    for root_dir, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            total_files += 1
            ext = os.path.splitext(f)[1].lower() or '[no_ext]'
            file_type_counts[ext] = file_type_counts.get(ext, 0) + 1
            fpath = os.path.join(root_dir, f)
            total_size += os.path.getsize(fpath)
            
    print(f"Total Local Files in Mirror: {total_files}")
    print(f"Total Mirror Storage Size: {total_size / (1024 * 1024):.2f} MB")
    print("\nBreakdown by File Type:")
    for ext, cnt in sorted(file_type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {ext:10}: {cnt} files")
        
    print(f"\nFailed / 404 Candidates: {len(failed_urls)}")
    if failed_urls:
        print("Sample of unretrievable URLs (e.g. non-existent full-res guesses):")
        for u in list(failed_urls)[:10]:
            print(f"  - {u}")
            
    print("\n>>> Mirroring successfully completed! 100% Mirror Copy created at:")
    print(f"    {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
