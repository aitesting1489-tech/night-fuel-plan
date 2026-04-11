import { useState } from "react";
import { Share2, Twitter, Facebook, LinkIcon, Instagram, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateShareCard, downloadShareCard } from "@/lib/shareCardGenerator";

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  /** Optional: enables Instagram Stories share card generation */
  shareCardData?: {
    score?: number | string;
    stageName?: string;
    stageEmoji?: string;
    mascotSrc: string;
    subtitle?: string;
  };
}

const APP_URL = "https://night-fuel-plan.lovable.app";

const SocialShare = ({ title, text, url = APP_URL, className = "", shareCardData }: SocialShareProps) => {
  const { toast } = useToast();
  const [generatingCard, setGeneratingCard] = useState(false);

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

  const handleInstagramShare = async () => {
    if (!shareCardData) return;
    setGeneratingCard(true);
    try {
      const dataUrl = await generateShareCard({
        title,
        score: shareCardData.score,
        stageName: shareCardData.stageName,
        stageEmoji: shareCardData.stageEmoji,
        mascotSrc: shareCardData.mascotSrc,
        subtitle: shareCardData.subtitle,
      });
      downloadShareCard(dataUrl, `circadia-${title.toLowerCase().replace(/\s+/g, "-")}.png`);
      toast({
        title: "Image saved! 📸",
        description: "Open Instagram Stories and add the downloaded image.",
      });
    } catch {
      toast({ title: "Error", description: "Could not generate share card.", variant: "destructive" });
    } finally {
      setGeneratingCard(false);
    }
  };

  const btnClass =
    "h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Native share (mobile) */}
      {"share" in navigator && (
        <button onClick={shareNative} className={btnClass} title="Share">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Instagram Stories card */}
      {shareCardData && (
        <button
          onClick={handleInstagramShare}
          disabled={generatingCard}
          className={btnClass}
          title="Download for Instagram Stories"
        >
          {generatingCard ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Instagram className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {/* Twitter/X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        title="Share on X"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        title="Share on Facebook"
      >
        <Facebook className="h-3.5 w-3.5" />
      </a>

      {/* Copy link */}
      <button onClick={copyLink} className={btnClass} title="Copy to clipboard">
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default SocialShare;
