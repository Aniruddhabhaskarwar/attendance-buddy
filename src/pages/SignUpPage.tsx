import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "../assets/logo.svg";

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    const trimmedName = fullName.trim();
    const trimmedInstitute = instituteName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      toast.error("Please enter your full name");
      return false;
    }

    if (!trimmedInstitute) {
      toast.error("Please enter your institute/class name");
      return false;
    }

    if (!trimmedEmail) {
      toast.error("Please enter your email");
      return false;
    }

    if (!password) {
      toast.error("Please enter your password");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const trimmedName = fullName.trim();
    const trimmedInstitute = instituteName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            institute_name: trimmedInstitute,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created successfully. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">Class</span>
            <span className="text-foreground">Track</span>
          </h1>
        </div>

        <p className="text-muted-foreground text-sm mt-2">
          Create your teacher account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            className="h-12"
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instituteName">Institute / Class Name</Label>
          <Input
            id="instituteName"
            type="text"
            placeholder="e.g. AB Classes"
            value={instituteName}
            onChange={(e) => setInstituteName(e.target.value)}
            disabled={loading}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="text"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-12"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="h-12"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="h-12"
            autoComplete="new-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-semibold"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </div>
  </div>
);}
export default SignUpPage;