export interface Requirements {
    variables?: Set<VariableName>
}

export interface FeatureOptions {
    data: {
        /**
         * The name of the feature as a lowercase string with only a-z.
         */
        name: string

        /**
         * The pretty name shown to the user.
         */
        prettyName: string

        /**
         * Requirements that this feature will not work without.
         *
         * The feature will refuse to be enabled if any of these requirements
         * are missing.
         */
        requires?: Requirements

        /**
         * Requirements that enable extra functionality to this feature.
         *
         * The feature can still be enabled if these requirements are missing.
         */
        softRequires?: Requirements
    }
}

export function defineFeature(options: FeatureOptions): FeatureOptions {
    return options
}
