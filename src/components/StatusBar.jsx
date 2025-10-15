const Loader = () => (
    <div className="inline-block border-2 border-current border-t-transparent rounded-full w-4 h-4 mr-2 animate-spin" role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
    </div>
);

export default function StatusBar({ status }) {
    const baseClasses = "card p-3 mb-6 text-center font-semibold rounded-lg shadow";
    const typeClasses = {
        info: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800',
        loading: 'bg-yellow-100 text-yellow-800 flex items-center justify-center'
    };

    return (
        <div className={`${baseClasses} ${typeClasses[status.type] || typeClasses.info}`}>
            {status.type === 'loading' && <Loader />}
            {status.message}
        </div>
    );
}
