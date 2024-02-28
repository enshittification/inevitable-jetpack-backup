export type Purchase = {
	ID: string;
	user_id: string;
	blog_id: string;
	product_id: string;
	subscribed_date: string;
	renew: string;
	auto_renew: string;
	renew_date: string;
	inactive_date: string | null;
	active: string;
	meta: string | object;
	ownership_id: string;
	most_recent_renew_date: string;
	amount: number;
	expiry_date: string;
	expiry_message: string;
	expiry_sub_message: string;
	expiry_status: string;
	partner_name: string | null;
	partner_slug: string | null;
	partner_key_id: string | null;
	subscription_status: string;
	product_name: string;
	product_slug: string;
	product_type: string;
	blog_created_date: string;
	blogname: string;
	domain: string;
	description: string;
	attached_to_purchase_id: string | null;
	included_domain: string;
	included_domain_purchase_amount: number;
	currency_code: string;
	currency_symbol: string;
	renewal_price_tier_slug: string | null;
	renewal_price_tier_usage_quantity: number | null;
	current_price_tier_slug: string | null;
	current_price_tier_usage_quantity: number | null;
	price_tier_list: Array< object >;
	price_text: string;
	bill_period_label: string;
	bill_period_days: number;
	regular_price_text: string;
	regular_price_integer: number;
	product_display_price: string;
	price_integer: number;
	is_cancelable: boolean;
	can_explicit_renew: boolean;
	can_disable_auto_renew: boolean;
	can_reenable_auto_renewal: boolean;
	iap_purchase_management_link: string | null;
	is_iap_purchase: boolean;
	is_locked: boolean;
	is_refundable: boolean;
	refund_period_in_days: number;
	is_renewable: boolean;
	is_renewal: boolean;
	has_private_registration: boolean;
	refund_amount: number;
	refund_integer: number;
	refund_currency_symbol: string;
	refund_text: string;
	refund_options: object | null;
	total_refund_amount: number;
	total_refund_integer: number;
	total_refund_currency: string;
	total_refund_text: string;
	check_dns: boolean;
};

export type ProductCamelCase = {
	class: string;
	description: string;
	disclaimers: Array< string[] >;
	features: string[];
	featuresByTier: Array< string >;
	hasRequiredPlan: boolean;
	hasRequiredTier: Array< string >;
	isBundle: boolean;
	isPluginActive: boolean;
	isUpgradableByBundle: string[];
	longDescription: string;
	manageUrl: string;
	name: string;
	pluginSlug: string;
	postActivationUrl: string;
	postCheckoutUrl?: string;
	pricingForUi?: {
		available: boolean;
		wpcomProductSlug: string;
		productTerm: string;
		currencyCode: string;
		fullPrice: number;
		discountPrice: number;
		couponDiscount: number;
		isIntroductoryOffer: boolean;
		introductoryOffer?: {
			costPerInterval: number;
			intervalCount: number;
			intervalUnit: string;
			shouldProrateWhenOfferEnds: boolean;
			transitionAfterRenewalCount: number;
			usageLimit?: number;
		};
	};
	purchaseUrl?: string;
	requiresUserConnection: boolean;
	slug: string;
	standalonePluginInfo: {
		hasStandalonePlugin: boolean;
		isStandaloneInstalled: boolean;
		isStandaloneActive: boolean;
	};
	status: string;
	supportedProducts: string[];
	tiers: string[];
	title: string;
	wpcomProductSlug: string;
};

export type ProductSnakeCase = Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ][ string ];
