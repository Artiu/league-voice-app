import { Slider, SliderFilledTrack, SliderThumb, SliderTrack, Tooltip } from "@chakra-ui/react";
import { useState } from "react";

interface VolumeChangerProps {
    volume: number;
    onChange: (value: number) => void;
}

export default function VolumeChanger({ volume, onChange }: VolumeChangerProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <Slider
            focusThumbOnChange={false}
            onChange={onChange}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            value={volume}
        >
            <SliderTrack>
                <SliderFilledTrack />
            </SliderTrack>
            <Tooltip
                hasArrow
                bg="teal.500"
                color="white"
                placement="top"
                isOpen={showTooltip}
                label={`${volume}%`}
            >
                <SliderThumb />
            </Tooltip>
        </Slider>
    );
}
