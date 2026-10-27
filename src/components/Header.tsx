import { Link, NavLink } from 'react-router-dom';
import { brand, navItems } from '../data/site';
export function Header() {
  return <header className="site-header"><div className="site-header-inner"><Link to="/" className="brand" aria-label={`${brand.name} home`}><img className="brand-mark" src="/assets/cognicode-mark.svg" alt=""/><span className="brand-wordmark">{brand.name}</span></Link>
    <nav className="main-nav" aria-label="Main navigation">{navItems.map(item => <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>{item.label}</NavLink>)}</nav>
    <button className="button button-quiet sign-in" disabled title="Coming soon">Sign in</button></div>
  </header>;
}
