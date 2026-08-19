-- ===========================================================================
-- 🌟 UPDATED STORED PROCEDURE: sp_GetDashboardAndNotifications
-- (Fixed: Removed LastActiveDate reference to rely cleanly on Users.IsOnline)
-- ===========================================================================

CREATE OR ALTER PROCEDURE sp_GetDashboardAndNotifications                    
    @CurrentUserId INT,                    
    @ActiveTab VARCHAR(50) = 'best-matches',                
    @PageNumber INT = 1,                
    @PageSize INT = 12                
AS                
BEGIN                
    SET NOCOUNT ON;                
                
    -- A. Check Paid Active Subscription for Current User               
    DECLARE @IsCurrentUserPaid BIT = 0;                  
    IF EXISTS (                  
        SELECT 1 FROM UserSubscriptions WITH (NOLOCK)                 
        WHERE UserId = @CurrentUserId                  
          AND PaymentStatus = 'SUCCESS'                  
          AND CAST(IsActive AS VARCHAR(10)) IN ('1', 'Yes', 'True')                  
          AND ExpiryDate >= GETUTCDATE()                  
    )                  
    BEGIN                  
        SET @IsCurrentUserPaid = 1;                  
    END                  
          
    -- B. Get Current User Details for Default Fallbacks          
    DECLARE @UserGender VARCHAR(20);    
              
    SELECT @UserGender = u.Gender    
    FROM Users u WITH (NOLOCK)          
    WHERE u.UserId = @CurrentUserId;          
          
    DECLARE @TargetGender VARCHAR(20);          
    SET @TargetGender = CASE WHEN LOWER(ISNULL(@UserGender, 'Male')) = 'male' THEN 'Female' ELSE 'Male' END;          
          
    DECLARE @Offset INT = CASE WHEN @PageNumber < 1 THEN 0 ELSE (@PageNumber - 1) * @PageSize END;          
    SET @ActiveTab = LOWER(ISNULL(@ActiveTab, 'best-matches'));    
          
    -- 📊 RESULT SET 1: TabCountsModel    
    SELECT          
        @IsCurrentUserPaid AS IsCurrentUserPaid,
        (SELECT COUNT(1) FROM Users u2 WITH (NOLOCK) WHERE ISNULL(u2.Gender, @TargetGender) = @TargetGender AND CAST(ISNULL(u2.IsActive, 1) AS VARCHAR(10)) IN ('1', 'Yes', 'True')) AS MatchesCount,          
        (SELECT COUNT(1) FROM UserInteractions WITH (NOLOCK) WHERE ReceiverUserId = @CurrentUserId AND InteractionType = 'INTEREST' AND Status = 'PENDING') AS RequestsCount,          
        (SELECT COUNT(1) FROM UserInteractions WITH (NOLOCK) WHERE (SenderUserId = @CurrentUserId OR ReceiverUserId = @CurrentUserId) AND InteractionType = 'INTEREST' AND Status = 'ACCEPTED') AS AcceptedCount,          
        (SELECT COUNT(1) FROM UserInteractions WITH (NOLOCK) WHERE ReceiverUserId = @CurrentUserId AND InteractionType = 'PHOTO_REQUEST' AND Status = 'PENDING') AS PhotosCount,          
        (SELECT COUNT(1) FROM UserInteractions WITH (NOLOCK) WHERE ReceiverUserId = @CurrentUserId AND InteractionType = 'PROFILE_VIEW') AS VisitorsCount,          
        (SELECT COUNT(1) FROM UserInteractions WITH (NOLOCK) WHERE SenderUserId = @CurrentUserId AND InteractionType = 'SHORTLIST') AS ShortlistedCount;    
    
    -- 👥 RESULT SET 2: ProfileModel    
    SELECT           
        u.UserId,          
        ISNULL(u.FullName, 'Member') AS FullName,          
            
        -- Age Calculation    
        CASE     
            WHEN TRY_CAST(ud.DateOfBirth AS DATETIME) IS NULL THEN 24    
            WHEN DATEDIFF(YEAR, TRY_CAST(ud.DateOfBirth AS DATETIME), GETDATE()) <= 0 THEN 24    
            ELSE DATEDIFF(YEAR, TRY_CAST(ud.DateOfBirth AS DATETIME), GETDATE()) -     
                 CASE WHEN (MONTH(TRY_CAST(ud.DateOfBirth AS DATETIME)) > MONTH(GETDATE()))     
                        OR (MONTH(TRY_CAST(ud.DateOfBirth AS DATETIME)) = MONTH(GETDATE()) AND DAY(TRY_CAST(ud.DateOfBirth AS DATETIME)) > DAY(GETDATE()))     
                      THEN 1 ELSE 0 END    
        END AS Age,    
    
        ISNULL(ud.CurrentStateId, 0) AS CurrentStateId,    
        ISNULL(ud.CurrentCityId, 0) AS CurrentCityId,    
        ISNULL(st.StateName, '') AS StateName,          
        ISNULL(ct.CityName, '') AS CityName,          
        ISNULL(sct.Value, '') AS Sect,          
        ISNULL(msl.Value, '') AS Maslak,          
        ISNULL(occ.Value, '') AS Profession,          
        ISNULL(edu.Value, '') AS Education,          
        ISNULL(CAST(ud.AnnualIncome AS VARCHAR(100)), 'Not Disclosed') AS AnnualIncome,          
    
        CAST(CASE WHEN CAST(u.IsVerified AS VARCHAR(10)) IN ('1', 'Yes', 'True') THEN 1 ELSE 0 END AS BIT) AS IsVerified,          
        
        -- 🌟 IS PREMIUM CHECK FOR TARGET USER
        CAST(CASE WHEN EXISTS (                  
            SELECT 1 FROM UserSubscriptions WITH (NOLOCK)                 
            WHERE UserId = u.UserId                  
              AND PaymentStatus = 'SUCCESS'                  
              AND CAST(IsActive AS VARCHAR(10)) IN ('1', 'Yes', 'True')                  
              AND ExpiryDate >= GETUTCDATE()                  
        ) THEN 1 ELSE 0 END AS BIT) AS IsPremium,

        -- 🟢 IS ONLINE CHECK FOR TARGET USER
        CAST(CASE 
            WHEN CAST(ISNULL(u.IsOnline, 0) AS VARCHAR(10)) IN ('1', 'Yes', 'True') THEN 1 
            ELSE 0 
        END AS BIT) AS IsOnline,

        ISNULL((          
            SELECT TOP 1 CONCAT('https://cdn.pakizarishte.com/', PhotoUrl)          
            FROM ProfilePhotos WITH (NOLOCK)          
            WHERE UserId = u.UserId AND IsMain = 1          
        ), '') AS PhotoUrl,          
    
        ISNULL(CAST(ud.PhotoPrivacy AS VARCHAR(100)), 'All Members') AS PhotoPrivacy,          
    
        ISNULL((          
            SELECT TOP 1           
                CASE           
                    WHEN SenderUserId = @CurrentUserId AND Status = 'PENDING' THEN 'SentPending'          
                    WHEN ReceiverUserId = @CurrentUserId AND Status = 'PENDING' THEN 'ReceivedPending'          
                    WHEN Status = 'ACCEPTED' THEN 'Accepted'          
                    WHEN Status = 'DECLINED' THEN 'Declined'          
                    ELSE 'None'          
                END          
            FROM UserInteractions WITH (NOLOCK)          
            WHERE (SenderUserId = @CurrentUserId AND ReceiverUserId = u.UserId AND InteractionType = 'INTEREST')          
               OR (SenderUserId = u.UserId AND ReceiverUserId = @CurrentUserId AND InteractionType = 'INTEREST')          
            ORDER BY InteractionId DESC          
        ), 'None') AS InterestStatus,    
  
        ISNULL((          
            SELECT TOP 1           
                CASE           
                    WHEN SenderUserId = @CurrentUserId AND Status = 'PENDING' THEN 'SentPending'          
                    WHEN ReceiverUserId = @CurrentUserId AND Status = 'PENDING' THEN 'ReceivedPending'          
                    WHEN SenderUserId = @CurrentUserId AND Status = 'ACCEPTED' THEN 'Accepted'          
                    WHEN ReceiverUserId = @CurrentUserId AND Status = 'ACCEPTED' THEN 'ReceivedAccepted'          
                    WHEN Status = 'DECLINED' THEN 'Declined'          
                    ELSE 'None'          
                END          
            FROM UserInteractions WITH (NOLOCK)          
            WHERE (SenderUserId = @CurrentUserId AND ReceiverUserId = u.UserId AND InteractionType = 'PHOTO_REQUEST')          
               OR (SenderUserId = u.UserId AND ReceiverUserId = @CurrentUserId AND InteractionType = 'PHOTO_REQUEST')          
            ORDER BY InteractionId DESC          
        ), 'None') AS PhotoRequestStatus,  
                  
        CAST(CASE WHEN EXISTS (          
            SELECT 1 FROM UserInteractions WITH (NOLOCK)          
            WHERE SenderUserId = @CurrentUserId AND ReceiverUserId = u.UserId AND InteractionType = 'SHORTLIST'          
        ) THEN 1 ELSE 0 END AS BIT) AS IsShortlisted,    
    
        CAST(CASE WHEN EXISTS (                
            SELECT 1 FROM UserInteractions WITH (NOLOCK)               
            WHERE SenderUserId = @CurrentUserId                  
              AND ReceiverUserId = u.UserId                  
              AND InteractionType = 'PHOTO_REQUEST'                  
              AND Status IN ('PENDING', 'DECLINED')                
        ) THEN 1 ELSE 0 END AS BIT) AS HasRequestedPhoto,    
    
        -- 🔒 STRICT INDIVIDUAL DIRECTION FOR PHOTO UNLOCK:  
        CAST(CASE                   
            WHEN ISNULL(ud.PhotoPrivacy, 'All Members') IN ('allmember', 'All Members', 'allmembers') THEN 0                   
            WHEN LOWER(REPLACE(ISNULL(ud.PhotoPrivacy, ''), ' ', '')) IN ('premiumonly', 'premium') THEN                   
                CASE                  
                    WHEN @IsCurrentUserPaid = 1 THEN 0                  
                    WHEN EXISTS (                  
                        SELECT 1 FROM UserInteractions WITH (NOLOCK)                  
                        WHERE SenderUserId = @CurrentUserId   
                          AND ReceiverUserId = u.UserId                  
                          AND InteractionType = 'PHOTO_REQUEST'   
                          AND Status = 'ACCEPTED'                  
                    ) THEN 0                
                    ELSE 1                  
                END                  
            WHEN LOWER(REPLACE(ISNULL(ud.PhotoPrivacy, ''), ' ', '')) IN ('onlyapproved', 'protected', 'onlyapprovedmembers') THEN                   
                CASE                  
                    WHEN EXISTS (                  
                        SELECT 1 FROM UserInteractions WITH (NOLOCK)                 
                        WHERE SenderUserId = @CurrentUserId   
                          AND ReceiverUserId = u.UserId                  
                          AND InteractionType = 'PHOTO_REQUEST'   
                          AND Status = 'ACCEPTED'                  
                    ) THEN 0                  
                    ELSE 1                  
                END                   
            ELSE 0                   
        END AS BIT) AS IsPhotoHidden,    
    
        CAST(CASE WHEN EXISTS (    
            SELECT 1 FROM UserInteractions WITH (NOLOCK)    
            WHERE ((SenderUserId = u.UserId AND ReceiverUserId = @CurrentUserId) OR (SenderUserId = @CurrentUserId AND ReceiverUserId = u.UserId))    
              AND InteractionType = 'INTEREST' AND Status = 'ACCEPTED'    
        ) THEN 1 ELSE 0 END AS BIT) AS IsCanChat    
                  
    FROM Users u WITH (NOLOCK)          
    LEFT JOIN profileDetails ud WITH (NOLOCK) ON u.UserId = ud.UserId          
    LEFT JOIN Master_States st WITH (NOLOCK) ON ud.CurrentStateId = st.Id          
    LEFT JOIN Master_Cities ct WITH (NOLOCK) ON ud.CurrentCityId = ct.Id          
    LEFT JOIN Master_Sects sct WITH (NOLOCK) ON ud.Sect = sct.Id          
    LEFT JOIN Master_Maslaks msl WITH (NOLOCK) ON ud.Maslak = msl.Id          
    LEFT JOIN Master_Castes cst WITH (NOLOCK) ON ud.Caste = cst.Id          
    LEFT JOIN Master_Occupations occ WITH (NOLOCK) ON ud.Designation = occ.Id          
    LEFT JOIN Master_Educations edu WITH (NOLOCK) ON ud.HighestDegree = edu.Id          
    
    WHERE u.UserId <> @CurrentUserId           
      AND ISNULL(u.Gender, @TargetGender) = @TargetGender          
      AND CAST(ISNULL(u.IsActive, 1) AS VARCHAR(10)) IN ('1', 'Yes', 'True')     
      AND (          
            (@ActiveTab IN ('best-matches', 'matches', 'all'))
            OR (@ActiveTab IN ('online', 'online-users', 'online-now') AND CAST(ISNULL(u.IsOnline, 0) AS VARCHAR(10)) IN ('1', 'Yes', 'True'))
            OR (@ActiveTab IN ('interests-sent', 'sent') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.SenderUserId = @CurrentUserId AND ui.ReceiverUserId = u.UserId AND ui.InteractionType = 'INTEREST'    
            ))          
            OR (@ActiveTab IN ('interests-received', 'requests', 'received') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.ReceiverUserId = @CurrentUserId AND ui.SenderUserId = u.UserId AND ui.InteractionType = 'INTEREST' AND ui.Status = 'PENDING'          
            ))          
            OR (@ActiveTab IN ('accepted', 'accepted-interests') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ((ui.SenderUserId = @CurrentUserId AND ui.ReceiverUserId = u.UserId) OR (ui.ReceiverUserId = @CurrentUserId AND ui.SenderUserId = u.UserId))          
                  AND ui.InteractionType = 'INTEREST' AND ui.Status = 'ACCEPTED'          
            ))          
            OR (@ActiveTab IN ('shortlisted-by-me', 'shortlisted', 'saved') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.SenderUserId = @CurrentUserId AND ui.ReceiverUserId = u.UserId AND ui.InteractionType = 'SHORTLIST'          
            ))          
            OR (@ActiveTab IN ('shortlisted-me', 'saved-by-members') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.ReceiverUserId = @CurrentUserId AND ui.SenderUserId = u.UserId AND ui.InteractionType = 'SHORTLIST'          
            ))    
            OR (@ActiveTab IN ('gallery-requests', 'photo-requests-sent') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.SenderUserId = @CurrentUserId AND ui.ReceiverUserId = u.UserId AND ui.InteractionType = 'PHOTO_REQUEST' AND ui.Status = 'PENDING'  
            ))    
            OR (@ActiveTab IN ('gallery-requests-received', 'photo-requests-received') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.ReceiverUserId = @CurrentUserId AND ui.SenderUserId = u.UserId AND ui.InteractionType = 'PHOTO_REQUEST' AND ui.Status = 'PENDING'  
            ))    
            OR (@ActiveTab IN ('profiles-viewed', 'recently-viewed') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.SenderUserId = @CurrentUserId AND ui.ReceiverUserId = u.UserId AND ui.InteractionType = 'PROFILE_VIEW'          
            ))    
            OR (@ActiveTab IN ('viewed-my-profile', 'visitors') AND EXISTS (    
                SELECT 1 FROM UserInteractions ui WITH (NOLOCK)     
                WHERE ui.ReceiverUserId = @CurrentUserId AND ui.SenderUserId = u.UserId AND ui.InteractionType = 'PROFILE_VIEW'          
            ))    
      )          
    ORDER BY 
        CASE WHEN @ActiveTab IN ('online', 'online-users') THEN CAST(ISNULL(u.IsOnline, 0) AS INT) END DESC,
        CAST(u.IsVerified AS VARCHAR(10)) DESC, 
        u.UserId DESC          
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;          
          
    -- 🔔 RESULT SET 3: NotificationModel    
    SELECT TOP 10    
        ui.InteractionId,    
        ui.SenderUserId,    
        ISNULL(su.FullName, 'Member') AS SenderName,    
        ISNULL((    
            SELECT TOP 1 CONCAT('https://cdn.pakizarishte.com/', PhotoUrl)    
            FROM ProfilePhotos WITH (NOLOCK)    
            WHERE UserId = su.UserId AND IsMain = 1    
        ), '') AS SenderPhoto,    
        ISNULL(ui.InteractionType, '') AS InteractionType,    
        ISNULL(ui.Status, '') AS Status,    
        ISNULL(ui.CreatedAt, GETUTCDATE()) AS CreatedAt,    
        CONCAT(ISNULL(su.FullName, 'Member'), ' expressed interest in your profile.') AS NotificationMessage    
    FROM UserInteractions ui WITH (NOLOCK)    
    LEFT JOIN Users su WITH (NOLOCK) ON ui.SenderUserId = su.UserId    
    WHERE ui.ReceiverUserId = @CurrentUserId    
    ORDER BY ui.InteractionId DESC;    
END;
