import { Share2, Twitter, Facebook, LinkIcon, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

const APP_URL = "https://night-fuel-plan.lovable.app";

const SocialShare = ({ title, text, url = APP_URL, className = "" }: SocialShareProps) => {
  const { toast } = useToast();

  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {}
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${text}\n${url}`);
    toast({ title: "Copied! 📋", description: "Share text copied to clipboard." });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Native share (mobile) */}
      {"share" in navigator && (
        <button
          onClick={shareNative}
          className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          title="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Twitter/X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        title="Share on X"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        title="Share on Facebook"
      >
        <Facebook className="h-3.5 w-3.5" />
      </a>

      {/* TikTok */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(`${text}\n${url}`);
          toast({ title: "Copied for TikTok! 🎵", description: "Paste into your TikTok caption or bio." });
        }}
        className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        title="Share on TikTok"
      >
        <Music2 className="h-3.5 w-3.5" />
      </button>

      {/* Copy link */}
      <button
        onClick={copyLink}
        className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        title="Copy to clipboard"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default SocialShare;
