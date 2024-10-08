import BaseModal from "../../../../../components/shared/Modal/BaseModal";
import Button from "../../../../../components/shared/Button";

export const MatchmakingFailModal = ({
  isOpen,
  setIsOpen,
  restart,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => any;
  restart: () => Promise<void>;
}) => {
  return (
    <BaseModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className={"flex flex-col items-center justify-center gap-8 px-4"}>
        <span
          className={"text-headline-2 font-medium uppercase text-left-accent"}
        >
          Matchmaking Failed!
        </span>
        <span
          className={"max-w-[60%] text-center font-plexsans text-[16px]/[16px]"}
        >
          You can try to find opponent one more time or just play in different
          lobby
        </span>
        <div className={"flex w-full flex-row items-center justify-between"}>
          <Button
            label={"Retry"}
            className={"group max-w-[30%]"}
            startContent={
              <svg
                width="16"
                height="17"
                viewBox="0 0 16 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.32 0.529464C8.70071 0.411635 10.0884 0.65447 11.347 1.23418C12.6056 1.81389 13.6921 2.7106 14.5 3.83646V2.25046C14.5 2.05155 14.579 1.86079 14.7197 1.72013C14.8603 1.57948 15.0511 1.50046 15.25 1.50046C15.4489 1.50046 15.6397 1.57948 15.7803 1.72013C15.921 1.86079 16 2.05155 16 2.25046V6.50046H11.75C11.5511 6.50046 11.3603 6.42145 11.2197 6.28079C11.079 6.14014 11 5.94938 11 5.75046C11 5.55155 11.079 5.36079 11.2197 5.22013C11.3603 5.07948 11.5511 5.00046 11.75 5.00046H13.477C12.7931 3.93037 11.8107 3.08405 10.6512 2.56605C9.4917 2.04806 8.20584 1.88107 6.95248 2.08573C5.69912 2.29038 4.53316 2.85772 3.59864 3.71764C2.66412 4.57757 2.00198 5.69241 1.694 6.92446C1.67128 7.02125 1.62955 7.11255 1.57123 7.19306C1.51291 7.27356 1.43917 7.34168 1.35429 7.39343C1.26942 7.44518 1.1751 7.47955 1.07682 7.49452C0.97854 7.5095 0.878265 7.50478 0.781825 7.48066C0.685385 7.45653 0.594703 7.41347 0.515053 7.35398C0.435404 7.2945 0.368375 7.21977 0.317865 7.13414C0.267355 7.04852 0.234371 6.95371 0.220832 6.85522C0.207293 6.75674 0.213469 6.65654 0.239 6.56046C0.643544 4.94289 1.5434 3.49214 2.81279 2.41101C4.08218 1.32988 5.65766 0.672394 7.319 0.530464L7.32 0.529464ZM3.92 15.3815C4.99199 16.0168 6.19758 16.393 7.44068 16.48C8.68378 16.567 9.93001 16.3623 11.08 15.8824C12.23 15.4025 13.252 14.6606 14.0646 13.7157C14.8771 12.7709 15.4577 11.6494 15.76 10.4405C15.805 10.2487 15.7728 10.0468 15.6702 9.87863C15.5676 9.71042 15.403 9.58932 15.2119 9.5415C15.0207 9.49369 14.8185 9.523 14.6488 9.6231C14.4791 9.7232 14.3556 9.88605 14.305 10.0765C13.9969 11.3083 13.3347 12.4228 12.4002 13.2825C11.4658 14.1422 10.3 14.7094 9.04688 14.9141C7.79373 15.1187 6.50809 14.9518 5.34871 14.434C4.18933 13.9163 3.20699 13.0702 2.523 12.0005H4.25C4.44891 12.0005 4.63968 11.9214 4.78033 11.7808C4.92098 11.6401 5 11.4494 5 11.2505C5 11.0516 4.92098 10.8608 4.78033 10.7201C4.63968 10.5795 4.44891 10.5005 4.25 10.5005H0V14.7505C0 14.9494 0.0790176 15.1401 0.21967 15.2808C0.360322 15.4214 0.551088 15.5005 0.75 15.5005C0.948912 15.5005 1.13968 15.4214 1.28033 15.2808C1.42098 15.1401 1.5 14.9494 1.5 14.7505V13.1645C2.14478 14.0628 2.96879 14.8176 3.92 15.3815Z"
                  fill="#252525"
                  className={"group-hover:fill-left-accent"}
                />
              </svg>
            }
            onClick={restart}
          />
          <Button
            label={"Cancel"}
            color={"tertiary"}
            className={"max-w-[30%]"}
            onClick={() => setIsOpen(false)}
          />
        </div>
      </div>
    </BaseModal>
  );
};
