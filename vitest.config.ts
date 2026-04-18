import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        "environment": "node",
        "include": ["tests/**/*.test.ts"],
        "exclude": ["tests/integration/**"],
        "coverage": {
            "provider": "v8",
            "include": ["src/**/*.ts"],
            "exclude": ["src/interfaces/**", "src/types/**", "src/index.ts"],
            "reporter": ["text", "json-summary"],
            "thresholds": {
                "branches": 80,
                "functions": 80,
                "lines": 80,
                "statements": 80
            }
        }
    }
})
