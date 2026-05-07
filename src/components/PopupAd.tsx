import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

export function PopupAd() {
  const [s, setS] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("popup_ad_active,popup_ad_image,popup_ad_text,popup_ad_link,updated_at").eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (!data?.popup_ad_active) return;
        const dismissed = sessionStorage.getItem(`popup-${data.updated_at}`);
        if (dismissed) return;
        setS(data); setOpen(true);
      });
  }, []);

  if (!open || !s) return null;
  const close = () => { sessionStorage.setItem(`popup-${s.updated_at}`, "1"); setOpen(false); };
  const Inner = (
    <div className="relative max-w-md w-full rounded-2xl overflow-hidden border border-primary/30 bg-card/70 backdrop-blur-2xl shadow-2xl">
      <button onClick={close} className="absolute top-2 right-2 z-10 h-8 w-8 grid place-items-center rounded-full bg-background/70 hover:bg-background"><X className="h-4 w-4" /></button>
      {s.popup_ad_image && <img src={s.popup_ad_image} alt="" className="w-full max-h-80 object-cover" />}
      {s.popup_ad_text && <div className="p-4 text-sm whitespace-pre-wrap">{s.popup_ad_text}</div>}
    </div>
  );
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-background/70 backdrop-blur-sm" onClick={close}>
      <div onClick={(e) => e.stopPropagation()}>
        {s.popup_ad_link ? <a href={s.popup_ad_link} target="_blank" rel="noreferrer">{Inner}</a> : Inner}
      </div>
    </div>
  );
}
