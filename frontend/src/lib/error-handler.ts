import { AxiosError } from "axios";

export interface AppError {
    message: string;
    status?: number;
    code?: string;
    isNetworkError?: boolean;
    originalError: any;
}

export function handleApiError(error: any): AppError {
    if (error.isNetworkError) {
        return error as AppError;
    }

    const axiosError = error as AxiosError<any>;
    
    // Default error structure
    const appError: AppError = {
        message: "An unexpected error occurred. Please try again.",
        status: axiosError.response?.status,
        originalError: error,
    };

    if (!axiosError.response) {
        appError.message = "Unable to connect to the server. Please check your internet connection.";
        appError.isNetworkError = true;
        return appError;
    }

    const data = axiosError.response.data;
    const status = axiosError.response.status;

    // Use backend-provided message if available
    if (data?.message) {
        appError.message = data.message;
    } else {
        // Fallback to status-based messages
        switch (status) {
            case 400:
                appError.message = "Invalid request. Please check your input.";
                break;
            case 401:
                appError.message = "Session expired. Please sign in again.";
                break;
            case 403:
                appError.message = "You don't have permission to perform this action.";
                break;
            case 404:
                appError.message = "The requested resource was not found.";
                break;
            case 429:
                appError.message = "Too many requests. Please slow down.";
                break;
            case 500:
                appError.message = "Internal server error. Our team has been notified.";
                break;
        }
    }

    return appError;
}
