import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Trash2, Bell } from "lucide-react";

interface SavedSearch {
  id: string;
  search_name: string;
  location_state: string | null;
  location_district: string | null;
  radius_km: number;
  work_crop_type_ids: string[] | null;
  created_at: string;
}

export default function SavedSearches() {
  const navigate = useNavigate();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load saved searches");
    } else {
      setSavedSearches(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete saved search");
    } else {
      toast.success("Saved search deleted");
      loadSavedSearches();
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    // Navigate to advanced search with pre-filled filters
    const params = new URLSearchParams();
    if (search.location_state) params.set("state", search.location_state);
    if (search.location_district) params.set("district", search.location_district);
    params.set("radius", search.radius_km.toString());
    
    navigate(`/search?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Saved Searches</h1>
          <Button onClick={() => navigate("/search")}>
            <Search className="mr-2 h-4 w-4" />
            New Search
          </Button>
        </div>

        <div className="space-y-4">
          {savedSearches.map((search) => (
            <Card key={search.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{search.search_name}</CardTitle>
                    <CardDescription>
                      Created {new Date(search.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(search.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {search.location_state && (
                      <Badge variant="secondary">
                        State: {search.location_state}
                      </Badge>
                    )}
                    {search.location_district && (
                      <Badge variant="secondary">
                        District: {search.location_district}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      Radius: {search.radius_km}km
                    </Badge>
                  </div>
                  <Button onClick={() => handleRunSearch(search)} className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Run This Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {savedSearches.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="mb-4">No saved searches yet</p>
                <Button onClick={() => navigate("/search")}>
                  <Search className="mr-2 h-4 w-4" />
                  Create Your First Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
