import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

function App() {
  const {
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    getAccessTokenSilently,
    isLoading
  } = useAuth0();

  const [orders, setOrders] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const placeOrder = async () => {
    setErrorMessage("");

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: "https://api.pizza42.com/orders",
          scope: "create:orders"
        }
      });
       const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', JSON.stringify(payload, null, 2));

      const response = await fetch("http://localhost:4000/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          order: "Pizza42 Order Received - Thank you for your order!"
        })
      });

      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error placing order:", error);
      setErrorMessage(error.message || "Something went wrong placing the order.");
    }
  };

  if (isLoading) {
    return <div style={{ padding: 40, fontFamily: "Arial" }}>Loading...</div>;
  }

  return (
    <div
      style={{
        padding: 40,
        fontFamily: "Arial",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #8B0000, #FF4500)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <h1>Pizza42 - Home of the 42&quot; Pizza!</h1>

      {!isAuthenticated && (
        <button
          onClick={() => loginWithRedirect()}
          style={{
            backgroundColor: "#FFD700",
            border: "none",
            padding: "12px 20px",
            color: "#8B0000",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "20px"
          }}
        >
          Login / Sign Up
        </button>
      )}

      {isAuthenticated && (
        <>
          <p>Welcome to Pizza42: {user?.name || user?.email || "Customer"}!</p>

          <button
            onClick={placeOrder}
            style={{
              backgroundColor: "#FFD700",
              border: "none",
              padding: "10px 16px",
              color: "#8B0000",
              fontWeight: "bold",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            Order Pizza Now!
          </button>

          {errorMessage && (
            <p
              style={{
                color: "#ffe6e6",
                marginTop: "20px",
                maxWidth: "700px",
                textAlign: "center"
              }}
            >
              {errorMessage}
            </p>
          )}

          <h3 style={{ marginTop: "30px" }}>Order History</h3>

          <ul style={{ paddingLeft: "20px" }}>
            {orders.map((order, index) => (
              <li key={index}>{order}</li>
            ))}
          </ul>

          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            style={{
              marginTop: "20px",
              padding: "10px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;