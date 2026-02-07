import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewList } from "@/components/reviews/ReviewList";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          mobile_number: profile.mobile_number,
          email: profile.email,
          state: profile.state,
          district: profile.district,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          address: profile.address,
          coordinates_lat: profile.coordinates_lat,
          coordinates_lng: profile.coordinates_lng,
          preferred_language: profile.preferred_language,
          passport_number: profile.passport_number,
          election_card_number: profile.election_card_number,
          ration_card_number: profile.ration_card_number,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={profile?.avatar_url || ""}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile?.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                value={profile?.mobile_number || ""}
                onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile?.state || ""}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={profile?.district || ""}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile?.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile?.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Your full address..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinates_lat">Latitude (Optional)</Label>
                <Input
                  id="coordinates_lat"
                  type="number"
                  step="0.000001"
                  value={profile?.coordinates_lat || ""}
                  onChange={(e) => setProfile({ ...profile, coordinates_lat: parseFloat(e.target.value) || null })}
                  placeholder="13.0827"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinates_lng">Longitude (Optional)</Label>
                <Input
                  id="coordinates_lng"
                  type="number"
                  step="0.000001"
                  value={profile?.coordinates_lng || ""}
                  onChange={(e) => setProfile({ ...profile, coordinates_lng: parseFloat(e.target.value) || null })}
                  placeholder="80.2707"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_language">Preferred Language</Label>
              <select
                id="preferred_language"
                className="w-full p-2 border rounded"
                value={profile?.preferred_language || "en"}
                onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="bn">Bengali</option>
                <option value="mr">Marathi</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Additional ID Proofs (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input
                  id="passport_number"
                  value={profile?.passport_number || ""}
                  onChange={(e) => setProfile({ ...profile, passport_number: e.target.value })}
                  placeholder="A1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="election_card_number">Election Card Number</Label>
                <Input
                  id="election_card_number"
                  value={profile?.election_card_number || ""}
                  onChange={(e) => setProfile({ ...profile, election_card_number: e.target.value })}
                  placeholder="ABC1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ration_card_number">Ration Card Number</Label>
                <Input
                  id="ration_card_number"
                  value={profile?.ration_card_number || ""}
                  onChange={(e) => setProfile({ ...profile, ration_card_number: e.target.value })}
                  placeholder="123456789012"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile?.role || ""} disabled />
            </div>

            {profile?.role === "farm_worker" && (
              <div>
                <Button onClick={() => navigate("/my-work-types")} variant="outline" className="w-full">
                  Manage My Work Types & Skills
                </Button>
              </div>
            )}

            {profile?.average_rating > 0 && (
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-semibold">
                    {profile.average_rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({profile.total_ratings} review{profile.total_ratings !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {profile && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewList userId={profile.id} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
