import { neutral_blacks } from "./neutrals/blacks";
import { neutral_whites } from "./neutrals/whites";
import { neutral_grays } from "./neutrals/grays";
import { neutral_browns } from "./neutrals/browns";

export const themeConfig = {
    colors: {
        ...neutral_blacks,
        ...neutral_whites,
        ...neutral_grays,
        ...neutral_browns,
    }
} as const;
