/**
 * Style configuration object
 * Contains reusable Tailwind CSS classes for consistent styling
 */
interface Styles {
  // Layout
  boxWidth: string;
  flexCenter: string;
  flexStart: string;

  // Typography
  heading2: string;
  paragraph: string;
  paragraph2: string;
  paragraph3: string;

  // Spacing
  paddingX: string;
  paddingY: string;
  padding: string;
  padding2: string;
  marginX: string;
  marginY: string;
}

const styles: Styles = {
  // Layout
  boxWidth: "xl:max-w-[1280px] w-full",
  flexCenter: "flex justify-center items-center",
  flexStart: "flex justify-center items-start",

  // Typography
  heading2: "font-poppins font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full",
  paragraph: "font-poppins font-normal text-white text-center text-[18px] leading-[30.8px]",
  paragraph2: "font-poppins font-normal text-white text-center text-[14px] leading-[30.8px]",
  paragraph3: "font-poppins font-normal text-black text-center text-[14px] leading-[30.8px]",

  // Spacing
  paddingX: "sm:px-16 px-6",
  paddingY: "sm:py-10 py-6",
  padding: "sm:px-16 px-6 sm:py-12 py-4",
  padding2: "sm:px-16 px-6 sm:py-4 py-4",
  marginX: "sm:mx-16 mx-6",
  marginY: "sm:my-16 my-6",
};

/**
 * Layout configuration object
 * Contains reusable layout patterns using the base styles
 */
interface Layout {
  section: string;
  sectionReverse: string;
  sectionImgReverse: string;
  sectionImg: string;
  sectionInfo: string;
}

export const layout: Layout = {
  section: `flex md:flex-row flex-col ${styles.paddingY}`,
  sectionReverse: `flex md:flex-row flex-col-reverse ${styles.paddingY}`,
  sectionImgReverse: `flex-1 flex ${styles.flexCenter} md:mr-10 mr-0 md:mt-0 mt-10 relative`,
  sectionImg: `flex-1 flex ${styles.flexCenter} md:ml-10 ml-0 md:mt-0 mt-10 relative`,
  sectionInfo: `flex-1 ${styles.flexStart} flex-col`,
};

export default styles;
  