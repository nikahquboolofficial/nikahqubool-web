-- ===========================================================================
-- 🌟 EXACT MATCHED PROCEDURE: sp_GetUserSubscriptionHistory
-- Database: pakiza-rishte
-- ===========================================================================

CREATE OR ALTER PROCEDURE sp_GetUserSubscriptionHistory
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.UserSubId AS SubscriptionId,
        s.UserId,
        s.PlanId,
        ISNULL(p.PlanName, 'VIP Membership Plan') AS PlanName,
        ISNULL(s.FinalPaidAmount, ISNULL(p.DiscountPrice, p.OriginalPrice)) AS AmountPaid,
        s.PromoCode,
        s.TransactionId,
        s.StartDate,
        s.ExpiryDate,
        s.PaymentStatus,
        s.TotalContactsAllowed,
        s.ContactsUsed,
        CAST(CASE 
            WHEN CAST(ISNULL(s.IsActive, 1) AS VARCHAR(10)) IN ('1', 'Yes', 'True') 
                 AND s.ExpiryDate >= GETUTCDATE() 
            THEN 1 ELSE 0 
        END AS BIT) AS IsActive
    FROM UserSubscriptions s WITH (NOLOCK)
    LEFT JOIN SubscriptionPlans p WITH (NOLOCK) ON s.PlanId = p.PlanId
    WHERE s.UserId = @UserId
    ORDER BY s.UserSubId DESC;
END;
GO
