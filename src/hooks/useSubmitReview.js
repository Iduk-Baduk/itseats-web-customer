import { useState } from 'react';
import { submitReview } from '../services/reviewAPI';

export default function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitReview = async ({ orderId, storeStar, riderStar, menuLiked, content }) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      storeStar,
      riderStar,
      menuLiked,
      content,
    };

    try {
      const result = await submitReview(orderId, payload);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmitReview,
    isSubmitting,
    error,
  };
}
