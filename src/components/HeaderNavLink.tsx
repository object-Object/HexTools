import { Button } from "@mantine/core";
import { Link, useRoute } from "wouter";

export interface HeaderNavLinkProps {
  label: string;
  href: string;
  onClick: () => unknown;
}

export default function HeaderNavLink({
  label,
  href,
  onClick,
}: HeaderNavLinkProps) {
  const [isActive] = useRoute(href);

  return (
    <Button
      key={href}
      variant={isActive ? "filled" : "default"}
      component={Link}
      href={href}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
