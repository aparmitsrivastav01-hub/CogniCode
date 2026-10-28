import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { brand, navItems } from '../data/site';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (to === '/#how-it-works') {
      e.preventDefault();
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (location.pathname === '/') {
        const el = document.getElementById('how-it-works');
        if (el) {
          el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          window.history.replaceState(null, '', '#how-it-works');
        }
      } else {
        navigate('/#how-it-works');
      }
    }
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand" aria-label={`${brand.name} home`}>
          <img className="brand-mark" src="/assets/cognicode-mark.svg" alt="" />
          <span className="brand-wordmark">{brand.name}</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={e => handleNavClick(e, item.to)}
              className={({ isActive }) =>
                isActive && item.to !== '/#how-it-works' ? 'nav-link active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="button button-quiet sign-in" disabled title="Coming soon">
          Sign in
        </button>
      </div>
    </header>
  );
}

export default Header;
