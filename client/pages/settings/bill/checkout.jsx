import React, { useState, useEffect } from "react";
import Button from '@mui/material/Button';
import { useUser } from "@clerk/nextjs";

const ProductDisplay = ({ handleCheckout }) => (
    <section>
        <Button variant="contained" onClick={handleCheckout}>
            Checkout
        </Button>
    </section>
);

const Message = ({ message }) => (
    <section>
        <p>{message}</p>
    </section>
);

function App() {
    const [message, setMessage] = useState("");
    const { user } = useUser();
    const userId = user.id;

    useEffect(() => {
        // Check to see if this is a redirect back from Checkout
        const query = new URLSearchParams(window.location.search);

        if (query.get("success")) {
            setMessage("Order placed! You will receive an email confirmation.");
        }

        if (query.get("canceled")) {
            setMessage(
                "Order canceled -- continue to shop around and checkout when you're ready."
            );
        }
    }, []);

    const handleCheckout = async () => {
        // You can now use userId without any issues
        if (!userId) {
            setMessage("User ID is required");
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const formData = new FormData();
        // ... add any required formData if needed

        try {
            const response = await fetch(`${apiUrl}/api/create-sub?uid=${userId}`, {
                mode: "cors",
                method: "POST",
                body: formData,
                headers: {
                    'Content-Type': 'application/json' // Update your headers accordingly if needed
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url; // Redirect to Stripe Checkout
                } else {
                    setMessage("Failed to retrieve checkout URL. Please try again.");
                }
            } else {
                setMessage("Checkout failed. Please try again.");
            }
        } catch (error) {
            setMessage("An error occurred while attempting to checkout.");
            console.error("Checkout Error:", error);
        }
    };

    // The message state is used to display notifications or messages to the user
    return message ? (
        <Message message={message} />
    ) : (
        <ProductDisplay handleCheckout={handleCheckout} />
    );
}

export default App;
