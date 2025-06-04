import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";

const DemoOne = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center flex-row gap-4">
      <RippleButton> Click Me </RippleButton>
      <RippleButton variant="hover" hoverRippleColor="#16A34A"> 
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Success</span>
        </div>
      </RippleButton>
      <RippleButton variant="ghost" className="rounded-full"> X </RippleButton>
      <RippleButton variant="hoverborder" hoverBorderEffectThickness="3px" hoverBorderEffectColor="#DC2626"> Border </RippleButton>
    </div>
  );
};

export { DemoOne };
