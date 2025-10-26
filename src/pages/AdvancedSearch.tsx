import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, MapPin, Save, Bell } from "lucide-react";

interface WorkCropType {
  id: string;
  name: string;
  description: string;
}

interface WorkerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  state: string;
  district: string;
  bio: string | null;
  average_rating: number;
  total_ratings: number;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
}

export default function AdvancedSearch() {
  const navigate = useNavigate();
  const [workCropTypes, setWorkCropTypes] = useState<WorkCropType[]>([]);
  const [selectedCropTypes, setSelectedCropTypes] = useState<string[]>([]);
  const [searchRadius, setSearchRadius] = useState([5]);
  const [locationState, setLocationState] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [searchResults, setSearchResults] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");

  useEffect(() => {
    loadWorkCropTypes();
  }, []);

  const loadWorkCropTypes = async () => {
    const { data, error } = await supabase
      .from("work_crop_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to load work categories");
      return;
    }

    setWorkCropTypes(data || []);
  };

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      // Save to search history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("search_history").insert({
          user_id: user.id,
          search_query: `${locationState} ${locationDistrict}`,
          search_filters: {
            state: locationState,
            district: locationDistrict,
            radius_km: searchRadius[0],
            work_crop_type_ids: selectedCropTypes
          }
        });
      }

      // Search for workers
      let query = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, state, district, bio, average_rating, total_ratings, coordinates_lat, coordinates_lng")
        .eq("role", "farm_worker")
        .eq("is_active", true);

      if (locationState) {
        query = query.eq("state", locationState);
      }

      if (locationDistrict) {
        query = query.eq("district", locationDistrict);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Search failed");
        return;
      }

      setSearchResults(data || []);
      toast.success(`Found ${data?.length || 0} workers`);
    } catch (error) {
      toast.error("An error occurred during search");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error("Please enter a name for this search");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to save searches");
      return;
    }

    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      search_name: saveSearchName,
      location_state: locationState,
      location_district: locationDistrict,
      radius_km: searchRadius[0],
      work_crop_type_ids: selectedCropTypes
    });

    if (error) {
      toast.error("Failed to save search");
      return;
    }

    toast.success("Search saved successfully");
    setSaveSearchName("");
  };

  const handleCreateAlert = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create alerts");
      return;
    }

    const { error } = await supabase.from("job_alerts").insert({
      user_id: user.id,
      search_criteria: {
        state: locationState,
        district: locationDistrict,
        radius_km: searchRadius[0],
        work_crop_type_ids: selectedCropTypes
      },
      is_active: true
    });

    if (error) {
      toast.error("Failed to create alert");
      return;
    }

    toast.success("Job alert created successfully");
  };

  const toggleCropType = (id: string) => {
    setSelectedCropTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Find Workers</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Search Filters</CardTitle>
                <CardDescription>Refine your search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g., Tamil Nadu"
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="e.g., Chennai"
                    value={locationDistrict}
                    onChange={(e) => setLocationDistrict(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Search Radius: {searchRadius[0]} km</Label>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    min={5}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Work Categories</Label>
                  <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                    {workCropTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={selectedCropTypes.includes(type.id)}
                          onCheckedChange={() => toggleCropType(type.id)}
                        />
                        <Label htmlFor={type.id} className="cursor-pointer">
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSearch} disabled={loading} className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Searching..." : "Search"}
                </Button>

                <div className="space-y-2">
                  <Input
                    placeholder="Save search as..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSearch} variant="outline" className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={handleCreateAlert} variant="outline" className="flex-1">
                      <Bell className="mr-2 h-4 w-4" />
                      Alert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  {searchResults.length} worker{searchResults.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((worker) => (
                    <Card
                      key={worker.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/workers/${worker.id}`)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={worker.avatar_url || undefined} />
                          <AvatarFallback>{worker.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{worker.full_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{worker.district}, {worker.state}</span>
                          </div>
                          {worker.bio && (
                            <p className="text-sm text-muted-foreground mt-1">{worker.bio}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {worker.total_ratings > 0 && (
                              <Badge variant="secondary">
                                ⭐ {worker.average_rating?.toFixed(1)} ({worker.total_ratings} reviews)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No workers found. Try adjusting your search criteria.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
