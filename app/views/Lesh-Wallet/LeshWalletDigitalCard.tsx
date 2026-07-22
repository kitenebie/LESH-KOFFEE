import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppData } from '../../../lib/useAppData';

interface LeshWalletDigitalCardProps {
  walletBalance: number;
  onTopUpPress: () => void;
}

export default function LeshWalletDigitalCard({
  walletBalance,
  onTopUpPress
}: LeshWalletDigitalCardProps) {
  const { data: dummyData } = useAppData();
  const router = useRouter();
  
  // Use loyalty points from context or fallback to walletBalance
  const balance = Number(dummyData?.user?.loyaltyPoints) || walletBalance || 200;

  const gotoStapCardPage = () => {
    router.push('/views/StampCard');
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.cardContent}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.cloudLogoContainer}>
             <Image 
                source={require('../../../assets/app/logo.png')} 
                style={styles.headerLogoImg} 
                resizeMode="contain" 
             />
          </View>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.brandTitle}>fōam</Text>
            <Text style={styles.brandSubtitle}>coffee</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Ionicons name="heart" size={10} color="#82C1F9" style={{ marginHorizontal: 6 }} />
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.brandSlogan}>GOOD COFFEE. GOOD MOOD.</Text>
          </View>
        </View>

        {/* Blue Points Section */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsTopRow}>
            <View style={styles.coinContainer}>
              <View style={styles.coinInner}>
                <Ionicons name="star" size={28} color="#D4AF37" />
              </View>
            </View>
            
            <View style={styles.pointsTextContainer}>
              <Text style={styles.pointsValue}>{balance}</Text>
              <Text style={styles.pointsLabel}>LOYALTY POINTS</Text>
            </View>
          </View>
        </View>

        {/* Features Row */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="bag-handle" size={20} color="#5A9BD5" />
            </View>
            <Text style={styles.featureTitle}>EARN POINTS</Text>
            <Text style={styles.featureDesc}>Every purchase{'\n'}earns you points!</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconBoxStar}>
              <Ionicons name="star" size={20} color="#F2C94C" />
            </View>
            <Text style={styles.featureTitle}>MORE POINTS</Text>
            <Text style={styles.featureDesc}>More points,{'\n'}more rewards!</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="cafe" size={20} color="#5A9BD5" />
            </View>
            <Text style={styles.featureTitle}>EXCLUSIVE PERKS</Text>
            <Text style={styles.featureDesc}>Unlock special treats{'\n'}and offers!</Text>
          </View>
        </View>

        {/* Bottom Wavy Footer */}
        <View style={styles.bottomWave} pointerEvents="none" />
        
        <View style={styles.footerContent}>
          
          <TouchableOpacity style={styles.viewRewardsBtn} activeOpacity={0.8} onPress={gotoStapCardPage}>
            <Text style={styles.viewRewardsText}>VIEW REWARDS</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 24,
  },
  cardContent: {
    width: '100%',
    backgroundColor: '#FDF8F2',
    borderRadius: 32,
    paddingTop: 30,
    paddingBottom: 24,
    overflow: 'hidden',
    shadowColor: '#D1C8B8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    justifyContent: 'center',
  },
  cloudLogoContainer: {
    width: 80,
    height: 60,
    backgroundColor: '#95C4F3',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginRight: 20,
  },
  headerLogoImg: {
    width: 40,
    height: 40,
  },
  headerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: '#3D2B1F',
    lineHeight: 30,
  },
  brandSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#3D2B1F',
    lineHeight: 18,
    marginTop: -4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#95C4F3',
  },
  brandSlogan: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#3D2B1F',
    letterSpacing: 1.2,
  },
  pointsCard: {
    backgroundColor: '#A9D5FA',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  coinContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F7C64B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  coinInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFD966',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7C64B',
  },
  pointsTextContainer: {
    marginLeft: 20,
  },
  pointsValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 54,
    color: '#FFFFFF',
    lineHeight: 60,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pointsLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#2463A5',
    letterSpacing: 1,
    marginTop: -4,
  },
  rewardPill: {
    backgroundColor: '#EBF4FC',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardTextPrefix: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    color: '#333333',
    marginLeft: 6,
  },
  rewardTextHighlight: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#2463A5',
  },
  rewardTarget: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#333333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 6,
    marginRight: 12,
  },
  progressFill: {
    height: 12,
    backgroundColor: '#357CDB',
    borderRadius: 6,
  },
  progressText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#2463A5',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 44, 
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#C7E2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconBoxStar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#D1C8B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9.5,
    color: '#2463A5',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 8,
    color: '#3B291A',
    textAlign: 'center',
    lineHeight: 12,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    right: -30,
    height: 120,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 130,
    backgroundColor: '#A9D5FA',
    zIndex: 0,
  },
  footerContent: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  earnedTodayPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#357CDB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  earnedTextCol: {
    marginRight: 6,
  },
  earnedValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#2463A5',
    lineHeight: 14,
  },
  earnedLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: '#555555',
    lineHeight: 11,
  },
  confettiIcon: {
    fontSize: 16,
  },
  viewRewardsBtn: {
    backgroundColor: '#357CDB',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#1A538A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  viewRewardsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFFFFF',
    marginRight: 6,
    letterSpacing: 0.5,
  },
});
