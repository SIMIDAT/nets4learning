import type { DatasetProcessed_t } from "@core/types";
import I_MODEL_TABULAR_CLASSIFICATION from "./_model";
import * as _Types from '@core/types'
import { DEFAULT_LAYERS_UPLOAD } from "../CONSTANTS";
import type { TFunction } from "i18next";

export default class MODEL__UPLOAD extends I_MODEL_TABULAR_CLASSIFICATION {
    static KEY = 'UPLOAD'

    constructor(t: TFunction<"translation", undefined>, callback: () => void) {
        super(t, callback)
    }

    DESCRIPTION() {
        return <></>
    }

    DATASETS(): Promise<DatasetProcessed_t[]> {
        return Promise.resolve([])
    }

    DEFAULT_LAYERS(): _Types.Layer_t[] {
        return DEFAULT_LAYERS_UPLOAD
    }
}