import React, { useEffect } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import OkIcon from '@mui/icons-material/Done';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// TrialModal component with Tailwind CSS
const TrialModal = ({isOpen, setOpen, userData}) => {
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
        <h2 className="text-black text-2xl mb-10">Your trial ends in __ days.</h2>
        <div>
</div>
<button
        onClick={skipUserStatus}
        type="button"
        data-dismiss="modal"
        aria-label="Close"
        className="bg-white text-black py-2 px-4 rounded border  hover:bg-gray-100 float-right"
        >
         <OkIcon/> <span>OK</span>
        </button>

      </div>
    </div>
    }
    </>
  );
};

export default TrialModal;
