import React from "react";
import styles from "../styles/style";
import { Navbar, Show } from "../Components";

/**
 * HomePage Component
 * Displays the main landing page with platform statistics and information
 */
const HomePage: React.FC = () => {
  return (
    <div className="w-full overflow-hidden bg-[#13141a]">
      {/* Navigation Section */}
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar />
        </div>
      </div>

      {/* Main Content Section */}
      <div className={`${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Show />
        </div>
      </div>
    </div>
  );
};

export default HomePage;

