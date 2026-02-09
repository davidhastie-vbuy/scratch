import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Lock, User, Phone, MapPin, Briefcase } from "lucide-react";
import { useTradeCategories } from "@/hooks/use-trade-categories";

const Signup = () => {
  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Customer fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  // Provider fields
  const [businessName, setBusinessName] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [providerPhone, setProviderPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [providerPostcode, setProviderPostcode] = useState("");
  const [tradeCategory, setTradeCategory] = useState("other");
  const [businessDescription, setBusinessDescription] = useState("");

  const isCustomer = role === "customer";
  const { categories: tradeCategories } = useTradeCategories(true);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const metadata: Record<string, string> = { role };

    if (isCustomer) {
      metadata.full_name = `${firstName} ${lastName}`.trim();
      metadata.first_name = firstName;
      metadata.last_name = lastName;
      metadata.phone = phone;
      metadata.address_line_1 = addressLine1;
      metadata.city = city;
      metadata.postcode = postcode;
    } else {
      metadata.full_name = `${contactFirstName} ${contactLastName}`.trim();
      metadata.first_name = contactFirstName;
      metadata.last_name = contactLastName;
      metadata.business_name = businessName;
      metadata.phone = providerPhone;
      metadata.business_address = businessAddress;
      metadata.postcode = providerPostcode;
      metadata.trade_category = tradeCategory;
      metadata.business_description = businessDescription;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      const message = isCustomer
        ? "We've sent you a confirmation link to verify your account."
        : "Your application has been submitted. An admin will review and approve your account.";
      toast({ title: "Check your email", description: message });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">TradeConnect</h1>
          <p className="mt-2 text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Get started
            </CardTitle>
            <CardDescription>Choose your role and fill in your details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              {/* Role selector */}
              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as "customer" | "provider")} className="flex gap-4">
                  <div className="flex-1">
                    <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                    <Label
                      htmlFor="customer"
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                    >
                      <span className="text-2xl">🏠</span>
                      <span className="font-semibold">Customer</span>
                      <span className="text-xs text-muted-foreground">I need work done</span>
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="provider" id="provider" className="peer sr-only" />
                    <Label
                      htmlFor="provider"
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                    >
                      <span className="text-2xl">🔧</span>
                      <span className="font-semibold">Provider</span>
                      <span className="text-xs text-muted-foreground">I offer services</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Email & password (shared) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required maxLength={255} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" minLength={6} required />
                </div>
              </div>

              {/* Customer fields */}
              {isCustomer && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" required maxLength={100} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={100} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="+44 7700 900000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" required maxLength={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address line 1</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="address" placeholder="123 High Street" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="pl-10" required maxLength={255} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="London" value={city} onChange={(e) => setCity(e.target.value)} required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input id="postcode" placeholder="SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} required maxLength={10} />
                    </div>
                  </div>
                </>
              )}

              {/* Provider fields */}
              {!isCustomer && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business name</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="businessName" placeholder="Smith's Plumbing" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="pl-10" required maxLength={200} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="contactFirst">Contact first name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="contactFirst" placeholder="John" value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} className="pl-10" required maxLength={100} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactLast">Contact last name</Label>
                      <Input id="contactLast" placeholder="Smith" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} required maxLength={100} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerPhone">Phone number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="providerPhone" type="tel" placeholder="+44 7700 900000" value={providerPhone} onChange={(e) => setProviderPhone(e.target.value)} className="pl-10" required maxLength={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddr">Business address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="businessAddr" placeholder="123 Trade Lane" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="pl-10" required maxLength={255} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="provPostcode">Postcode</Label>
                      <Input id="provPostcode" placeholder="SW1A 1AA" value={providerPostcode} onChange={(e) => setProviderPostcode(e.target.value)} required maxLength={10} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade">Trade category</Label>
                      <Select value={tradeCategory} onValueChange={setTradeCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradeCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bizDesc">Short description (optional)</Label>
                    <Textarea
                      id="bizDesc"
                      placeholder="Tell us about your business..."
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      maxLength={300}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{businessDescription.length}/300 characters</p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : isCustomer ? "Create account" : "Submit application"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
