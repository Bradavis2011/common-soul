import { Link, LinkProps } from "react-router-dom";
import { ReactNode } from "react";

interface ScrollLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export const ScrollLink = ({ to, children, className, ...props }: ScrollLinkProps) => {
  const handleClick = () => {
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  };

  return (
    <Link to={to} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
};