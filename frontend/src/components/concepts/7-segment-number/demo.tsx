// This is a demo of a preview
// That's what users will see in the preview

import { SevenSegmentNumber } from "@/components/ui/7-segment-number"

const Zero = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={0} />
    </div>
  );
};

const One = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={1} />
    </div>
  );
};

const Two = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={2} />
    </div>
  );
};

const Three = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={3} />
    </div>
  );
};

const Four = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={4} />
    </div>
  );
};

const Five = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={5} />
    </div>
  );
};

const Six = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={6} />
    </div>
  );
};

const Seven = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={7} />
    </div>
  );
};

const Eight = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={8} />
    </div>
  );
};

const Nine = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SevenSegmentNumber width={100} value={9} />
    </div>
  );
};

export { Zero, One, Two, Three, Four, Five, Six, Seven, Eight, Nine };
