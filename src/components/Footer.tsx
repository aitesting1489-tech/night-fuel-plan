import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="w-full border-t border-border/40 bg-card/30 backdrop-blur-sm mt-auto">
    <div className="max-w-screen-lg mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-display">
      <span className="tracking-wide">© {new Date().getFullYear()} Circadia</span>
      <nav className="flex items-center gap-4">
        <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
