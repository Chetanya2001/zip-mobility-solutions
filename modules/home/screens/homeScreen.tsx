import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - SPACING.xl * 2;

interface ServiceCard {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
}

interface FeaturedDeal {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image: string;
}

interface RecentCar {
  id: string;
  name: string;
  type: string;
  category: string;
  price: number;
  priceUnit: string;
  image: string;
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState("San Francisco, CA");

  const serviceCards: ServiceCard[] = [
    {
      id: "1",
      icon: "car-sport",
      title: "Self-Drive",
      subtitle: "Rent for any occasion",
      route: "SelfDrive",
    },
    {
      id: "2",
      icon: "navigate",
      title: "Intercity",
      subtitle: "City to city travel",
      route: "Intercity",
    },
    {
      id: "3",
      icon: "swap-horizontal",
      title: "Car Trade",
      subtitle: "Buy or sell your car",
      route: "Trade",
    },
    {
      id: "4",
      icon: "construct",
      title: "Maintenance",
      subtitle: "Repairs & checks",
      route: "Service",
    },
  ];

  const featuredDeals: FeaturedDeal[] = [
    {
      id: "1",
      title: "20% Off Luxury Rentals",
      subtitle: "Drive your dream car today",
      badge: "LIMITED OFFER",
      image:
        "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800",
    },
    {
      id: "2",
      title: "Free Delivery",
      subtitle: "With every booking",
      badge: "SERVICE",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
    },
  ];

  const recentlyViewed: RecentCar[] = [
    {
      id: "1",
      name: "BMW M4 Competition",
      type: "SELF-DRIVE",
      category: "PREMIUM",
      price: 140,
      priceUnit: "/day",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
    },
    {
      id: "2",
      name: "Tesla Model X",
      type: "INTERCITY",
      category: "ELECTRIC",
      price: 95,
      priceUnit: "/trip",
      image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400",
    },
  ];

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
      <View>
        <Text style={styles.headerLabel}>PICK-UP LOCATION</Text>
        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.locationText}>{location}</Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => navigation.getParent()?.openDrawer()}
      >
        <Ionicons
          name="person-circle-outline"
          size={44}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderGreeting = () => (
    <View style={styles.greetingContainer}>
      <Text style={styles.greeting}>
        Hello, <Text style={styles.greetingName}>Alex</Text>
      </Text>
      <Text style={styles.greetingSubtitle}>Ready for your next journey?</Text>
    </View>
  );

  const renderServiceCards = () => (
    <View style={styles.serviceGrid}>
      {serviceCards.map((service, index) => (
        <TouchableOpacity
          key={service.id}
          style={styles.serviceCard}
          activeOpacity={0.7}
        >
          <View style={styles.serviceIconContainer}>
            <Ionicons name={service.icon} size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFeaturedDeals = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Deals</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllButton}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dealsContainer}
      >
        {featuredDeals.map((deal) => (
          <TouchableOpacity
            key={deal.id}
            style={styles.dealCard}
            activeOpacity={0.8}
          >
            <Image source={{ uri: deal.image }} style={styles.dealImage} />
            <LinearGradient
              colors={["transparent", "rgba(10, 18, 32, 0.95)"]}
              style={styles.dealGradient}
            >
              {deal.badge && (
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>{deal.badge}</Text>
                </View>
              )}
              <Text style={styles.dealTitle}>{deal.title}</Text>
              <Text style={styles.dealSubtitle}>{deal.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecentlyViewed = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recently Viewed</Text>

      {recentlyViewed.map((car) => (
        <TouchableOpacity
          key={car.id}
          style={styles.recentCard}
          activeOpacity={0.8}
        >
          <Image source={{ uri: car.image }} style={styles.recentCarImage} />

          <View style={styles.recentCarInfo}>
            <Text style={styles.recentCarName}>{car.name}</Text>
            <Text style={styles.recentCarMeta}>
              {car.type} • {car.category}
            </Text>
            <Text style={styles.recentCarPrice}>
              ${car.price}
              <Text style={styles.recentCarPriceUnit}>{car.priceUnit}</Text>
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
      >
        {renderHeader()}
        {renderGreeting()}
        {renderServiceCards()}
        {renderFeaturedDeals()}
        {renderRecentlyViewed()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  locationText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  avatarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Greeting
  greetingContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  greeting: {
    fontSize: FONT_SIZES.hero,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  greetingName: {
    color: COLORS.primary,
  },
  greetingSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },

  // Service Cards
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  serviceCard: {
    width: (width - SPACING.xl * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  serviceTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs / 2,
  },
  serviceSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },

  // Section
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  viewAllButton: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Featured Deals
  dealsContainer: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  dealCard: {
    width: CARD_WIDTH * 0.85,
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.cardBackground,
  },
  dealImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dealGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    justifyContent: "flex-end",
  },
  dealBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  dealBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  dealTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs / 2,
  },
  dealSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },

  // Recently Viewed
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentCarImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  recentCarInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  recentCarName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs / 2,
  },
  recentCarMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
  },
  recentCarPrice: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  recentCarPriceUnit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },
});
