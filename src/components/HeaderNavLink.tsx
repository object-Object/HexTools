import { Button } from "@mantine/core";
import { Link, useRoute } from "wouter";

export interface HeaderNavLinkProps {
  label: string;
  path: string;
  onClick: () => unknown;
}

export default function HeaderNavLink({
  label,
  path,
  onClick,
}: HeaderNavLinkProps) {
  const [isActive] = useRoute(path);

  return (
    <Button
      key={path}
      variant={isActive ? "filled" : "default"}
      component={Link}
      href={path}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
