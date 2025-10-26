import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "mr", name: "मराठी (Marathi)" },
];

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserLanguage();
  }, []);

  const loadUserLanguage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();

    if (data?.preferred_language) {
      setSelectedLanguage(data.preferred_language);
    }

    setLoading(false);
  };

  const handleLanguageChange = async (languageCode: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSelectedLanguage(languageCode);

    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: languageCode })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update language preference");
    } else {
      const lang = languages.find(l => l.code === languageCode);
      toast.success(`Language changed to ${lang?.name}`);
    }
  };

  if (loading) return null;

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
