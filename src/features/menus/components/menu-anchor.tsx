import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { type MenuNode, menuLink } from "../menu-link";

/** One Menu item as an element: a router link inside the Storefront, a plain anchor for an
 * external address (new tab, rel=noopener), or a non-link for a group heading. */
export function MenuAnchor({
  node,
  onNavigate,
  children,
  onClick,
  ...rest
}: { node: MenuNode; onNavigate?: () => void } & Omit<
  ComponentProps<"a">,
  "href" | "target" | "rel"
>) {
  const link = menuLink(node);
  const content = children ?? node.label;
  // Radix wraps this in `asChild`, so its ref, handlers and data attributes arrive in `rest`
  // and must reach the element, or a click would not close the panel.
  const handleClick: ComponentProps<"a">["onClick"] = (event) => {
    onClick?.(event);
    onNavigate?.();
  };
  if (link.kind === "heading") return <span {...(rest as ComponentProps<"span">)}>{content}</span>;
  if (link.kind === "external") {
    return (
      <a {...rest} href={link.href} target={link.target} rel={link.rel} onClick={handleClick}>
        {content}
      </a>
    );
  }
  return (
    // The API hands over a resolved path, which the typed router cannot know about.
    <Link {...rest} to={link.to as string} onClick={handleClick}>
      {content}
    </Link>
  );
}
