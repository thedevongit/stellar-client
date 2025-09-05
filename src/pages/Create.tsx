import React from "react";
import styles from "../styles/style";
import { Navbar } from "../Components";
import OfferCreationForm from "../Components/offer/OfferCreationForm";
import { useSelector } from "react-redux";
import Notifications from "../Components/common/Notif";

/**
 * CreatePage Component
 * Allows users to create new items or listings
 */
const CreatePage: React.FC = () => {

  const { notification } = useSelector((state: any) => state.common);

  return (
    <div className="w-full overflow-hidden bg-[#13141a] min-h-screen">
      {notification.isNotified && (
        <Notifications
          type={notification.type}
          message={notification.message}
        />
      )}
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <OfferCreationForm />
      </div>
    </div>
  );
};

export default CreatePage; 