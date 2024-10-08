import React, { useEffect } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import SkipNextOutlinedIcon from '@mui/icons-material/SkipNextOutlined';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Modal component with Tailwind CSS
const Modal = ({isOpen, setOpen, userData}) => {
  const { user } = useUser();
  const stripe = useStripe();

  const [showCardElement, setShowCardElement] = React.useState(false);
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.log('[error]', error);
    } else {
      // Send the paymentMethod.id to your backend (e.g., via `axios.post`)
      // console.log("stripe_customer_id:",userData?.stripe_customer_id)
      axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/add-payment-method`, {
        payment_method_id: paymentMethod.id,
        customer_id: userData?.stripe_customer_id, // Use the customer ID from userData
        id: user.id,
      }).then(response => {
        setOpen(false);
        // Handle response
      }).catch(error => {
        console.error('Error saving payment method', error);
        // Handle error
      });
    }
  };


const handleAddCard = () => {
  setShowCardElement(true);
};

  const skipUserStatus =async ()=>{
    // const data = {
    //   id: user.id,
    //   status: "payment_method_not_added"
    // }
    // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/update-user-status`, data)
    setOpen(false);
  }
  // useEffect(()=>{
  //   skipUserStatus()
  // },[])
  return (
    <>
    {
        isOpen &&
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-20">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-black text-2xl mb-20">Trial period is over. Do you want to add a payment method?</h2>
        <div>
  {!showCardElement && <button className="bg-black text-white py-2 px-4 rounded hover:bg-gray-700 mr-2 mb-10" onClick={handleAddCard}>
    <CheckIcon/> <span>Yes</span> 
  </button>}
  <form onSubmit={handleSubmit}>
      {/* <button onClick={() => setShowCardElement(true)}>Add Card</button> */}
      {showCardElement && <>
      
        <CardElement />
        <button type="submit">Submit</button>
      </>
      }
    </form>
</div>

        <button
        onClick={skipUserStatus}
        type="button"
        data-dismiss="modal"
        aria-label="Close"
        className="bg-white text-black py-2 px-4 rounded border  hover:bg-gray-100 float-right"
        >
         <SkipNextOutlinedIcon/> <span>Skip for now</span>
        </button>
      </div>
    </div>
    }
    </>
  );
};

export default Modal;
