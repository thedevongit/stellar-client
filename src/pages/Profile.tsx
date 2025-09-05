import React from "react";
import styles from "../styles/style";
import { Navbar, ProfileOverview, TransactionHistory } from "../Components";

/**
 * ProfilePage Component
 * Displays user profile information and transaction history
 */
const ProfilePage: React.FC = () => {
  return (
    <div className="w-full overflow-hidden bg-[#13141a] min-h-screen">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <ProfileOverview />
        <TransactionHistory />
      </div>
    </div>
  );
};

export default ProfilePage; 