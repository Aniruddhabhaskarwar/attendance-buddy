import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type Organization = {
    id: string;
    name: string;
    trial_end_date: string | null;
    subscription_status: "trial" | "active" | "expired" | "cancelled" | "pending_payment";
    subscription_plan: string | null;
    subscription_end_date: string | null;
};

const PLANS = [
    { id: "monthly", title: "Monthly Plan", price: 299 },
    { id: "yearly", title: "Yearly Plan", price: 2999 },
];

export default function SubscriptionPage() {
    const { user } = useAuth();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
    const navigate = useNavigate();

    const daysLeft = useMemo(() => {
        if (!org?.trial_end_date) return 0;
        const diff = new Date(org.trial_end_date).getTime() - Date.now();
        return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    }, [org]);

    const fetchOrganization = async () => {
        try {
            setLoading(true);

            const { data: orgUser, error: orgUserError } = await supabase
                .from("organization_users")
                .select("organization_id")
                .eq("user_id", user?.id)
                .single();

            if (orgUserError) throw orgUserError;

            const { data, error } = await supabase
                .from("organizations")
                .select(
                    "id, name, trial_end_date, subscription_status, subscription_plan, subscription_end_date"
                )
                .eq("id", orgUser.organization_id)
                .single();

            if (error) throw error;

            setOrg(data);
        } catch (error: any) {
            alert(error.message || "Failed to load subscription.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchOrganization();
    }, [user?.id]);

    const PAYMENT_DETAILS = {
    upiId: "aniruddhabhaskarwar7@axisbank",
    mobile: "9067041991",
    payeeName: "ClassTrack",
    };

    const openPaymentInstructions = (plan: (typeof PLANS)[number]) => {
        const confirmed = window.confirm(
            `Pay ₹${plan.price} to ${PAYMENT_DETAILS.payeeName}\n\nUPI ID: ${PAYMENT_DETAILS.upiId}\nMobile: ${PAYMENT_DETAILS.mobile}\n\nAfter payment, click OK to submit activation request.`
        );

        if (confirmed) {
            requestActivation(plan);
        }
    };

    const requestActivation = async (plan: (typeof PLANS)[number]) => {
        if (!org) return;

        try {
            setSubmittingPlan(plan.id);

            const { error: paymentError } = await supabase
                .from("subscription_payments")
                .insert({
                    organization_id: org.id,
                    amount: plan.price,
                    payment_method: "manual_upi",
                    payment_status: "pending",
                    notes: `${plan.title} requested from web app`,
                });

            if (paymentError) throw paymentError;

            const { error: orgError } = await supabase
                .from("organizations")
                .update({
                    subscription_status: "pending_payment",
                    subscription_plan: plan.id,
                })
                .eq("id", org.id);

            if (orgError) throw orgError;

            alert("Activation request submitted. Admin will verify your payment and activate the plan.");
            await fetchOrganization();
        } catch (error: any) {
            alert(error.message || "Failed to create payment request.");
        } finally {
            setSubmittingPlan(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                Loading subscription...
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background text-foreground px-8 py-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Subscription</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your ClassTrack trial and subscription.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-bold">{org?.name}</h2>

                    {org?.subscription_status === "trial" && (
                        <p className="text-yellow-500 font-semibold">
                            {daysLeft} days left in trial
                        </p>
                    )}

                    {org?.subscription_status === "pending_payment" && (
                        <p className="text-yellow-500 font-semibold">
                            Payment pending confirmation
                        </p>
                    )}

                    {org?.subscription_status === "active" && (
                        <p className="text-green-500 font-semibold">
                            Subscription active
                        </p>
                    )}

                    {org?.subscription_end_date && (
                        <p className="text-sm text-muted-foreground">
                            Valid till: {new Date(org.subscription_end_date).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-card border border-border rounded-2xl p-6 space-y-4"
                        >
                            <h3 className="text-xl font-bold">{plan.title}</h3>
                            <p className="text-3xl font-bold text-yellow-500">₹{plan.price}</p>

                            <button
                                onClick={() => navigate(`/payment?plan=${plan.id}`)}
                                
                                disabled={submittingPlan === plan.id}
                                className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl disabled:opacity-60"
                            >
                                {submittingPlan === plan.id
                                    ? "Creating Request..."
                                    : "Request Activation"}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-bold mb-2">Manual Payment</h3>
                    <p className="text-sm text-muted-foreground">
                        Complete payment via UPI or cash. Admin will confirm and activate the subscription.
                    </p>
                </div>
            </div>
        </div>
    );
}