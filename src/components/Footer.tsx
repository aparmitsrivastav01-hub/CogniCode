import { Link } from 'react-router-dom';
import { brand, footerLinks, homeCopy } from '../data/site';
export function Footer() {
  return <footer className="site-footer"><div className="site-footer-inner"><div><Link to="/" className="brand" aria-label={`${brand.name} home`}><img className="brand-mark" src="/assets/cognicode-mark.svg" alt=""/><span className="brand-wordmark">{brand.name}</span></Link><p>{homeCopy.footer}</p></div><div className="footer-links">{footerLinks.map(label => <Link key={label} to={label === 'Home' ? '/' : '/' + label.toLowerCase()}>{label}</Link>)}</div><span className="copyright">© {new Date().getFullYear()} {brand.name}</span></div></footer>;
}
