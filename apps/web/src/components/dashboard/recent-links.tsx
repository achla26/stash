import { ExternalLink } from "lucide-react";

interface Link {
  id: number;
  title: string;
  url: string;
  date: string;
  favicon: string;
  thumbnail: string;
}

export function RecentLinks({ links }: { links: Link[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <LinkPreviewCard key={link.id} link={link} />
      ))}
    </div>
  );
}

function LinkPreviewCard({ link }: { link: Link }) {
  return (
    <div className="glass card-hover group cursor-pointer overflow-hidden rounded-xl border border-border p-4">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <img src={link.favicon} alt="" className="h-4 w-4 shrink-0" />
            <h4 className="line-clamp-1 text-sm font-medium text-foreground">
              {link.title}
            </h4>
          </div>

          <div className="mb-2 flex items-center gap-1">
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground">
              {link.url}
            </span>
          </div>

          <span className="text-xs text-muted-foreground">{link.date}</span>
        </div>

        <img
          src={link.thumbnail}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      </div>
    </div>
  );
}