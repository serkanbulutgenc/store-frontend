import { footerColumns, type MenuNode } from "../menu-link";
import { MenuAnchor } from "./menu-anchor";

const linkClass = "text-muted-foreground hover:text-foreground hover:underline";

/** The Footer menu: a titled column per group heading, loose links as an untitled row. */
export function FooterMenu({ items }: { items: MenuNode[] }) {
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-6">
      {footerColumns(items).map((column, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: columns have no id and are derived in order
        <div key={i}>
          {column.title && <h2 className="mb-2 font-medium">{column.title}</h2>}
          <ul className={column.title ? "space-y-2" : "flex flex-wrap gap-x-6 gap-y-2"}>
            {column.links.map((link, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              <li key={j}>
                <MenuAnchor node={link} className={linkClass} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
