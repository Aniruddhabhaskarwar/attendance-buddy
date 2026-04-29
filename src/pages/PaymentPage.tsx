import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const PAYMENT_DETAILS = {
    upiId: "aniruddhabhaskarwar7@axisbank",
    mobile: "9067041991",
    payeeName: "ClassTrack",
};

const PLAN_MAP: any = {
    monthly: { price: 299, title: "Monthly Plan" },
    yearly: { price: 2999, title: "Yearly Plan" },
};

export default function PaymentPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const planId = params.get("plan") || "monthly";
    const plan = PLAN_MAP[planId];

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const { data: orgUser } = await supabase
                .from("organization_users")
                .select("organization_id")
                .eq("user_id", user?.id)
                .single();

            const orgId = orgUser?.organization_id;

            if (!orgId) throw new Error("Organization not found");

            // create payment request
            const { error: paymentError } = await supabase
                .from("subscription_payments")
                .insert({
                    organization_id: orgId,
                    amount: plan.price,
                    payment_method: "manual_upi",
                    payment_status: "pending",
                    notes: `${plan.title} payment submitted`,
                });

            if (paymentError) throw paymentError;

            // update org
            await supabase
                .from("organizations")
                .update({
                    subscription_status: "pending_payment",
                    subscription_plan: planId,
                })
                .eq("id", orgId);

            alert("Payment submitted. Admin will activate your plan.");

            navigate("/subscription");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 space-y-6 text-center">

                <h1 className="text-2xl font-bold">{plan.title}</h1>
                <p className="text-3xl font-bold text-yellow-500">₹{plan.price}</p>

                {/* QR */}
                <div className="border rounded-xl p-4">
                    <img
                        src="/payment-qr.jpeg"
                        alt="QR"
                        className="w-full h-auto"
                    />
                </div>

                {/* UPI */}
                <div className="text-sm text-muted-foreground">
                    <p>UPI ID:</p>
                    <p className="font-bold text-foreground">{PAYMENT_DETAILS.upiId}</p>

                    <p className="mt-2">Mobile:</p>
                    <p className="font-bold text-foreground">{PAYMENT_DETAILS.mobile}</p>
                </div>

                {/* Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl"
                >
                    {loading ? "Submitting..." : "I have paid"}
                </button>
            </div>
        </div>
    );
}