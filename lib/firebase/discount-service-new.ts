// lib/firebase/discount-service-new.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { DiscountCoupon } from '@/types/discount';

export const discountServiceNew = {
  // Criar cupom na subcollection
  async createCoupon(storeId: string, couponData: Omit<DiscountCoupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const storeRef = doc(db, 'stores', storeId);

      const coupon: Omit<DiscountCoupon, 'id'> = {
        ...couponData,
        usedCount: 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const couponRef = await addDoc(collection(storeRef, 'discounts'), coupon);
      return couponRef.id;
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      throw new Error('Falha ao criar cupom');
    }
  },

  // Buscar cupom por ID
  async getCoupon(storeId: string, couponId: string): Promise<DiscountCoupon | null> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const couponDoc = await getDoc(doc(storeRef, 'discounts', couponId));

      if (couponDoc.exists()) {
        const data = couponDoc.data();
        return {
          id: couponDoc.id,
          ...data,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DiscountCoupon;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cupom:', error);
      return null;
    }
  },

  // Buscar cupom por código (case insensitive)
  async getCouponByCode(storeId: string, code: string): Promise<DiscountCoupon | null> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const couponsQuery = query(
        collection(storeRef, 'discounts'),
        where('code', '==', code.toUpperCase().trim()),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(couponsQuery);

      if (querySnapshot.empty) {
        return null;
      }

      const couponDoc = querySnapshot.docs[0];
      const data = couponDoc.data();
      return {
        id: couponDoc.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as DiscountCoupon;
    } catch (error) {
      console.error('Erro ao buscar cupom por código:', error);
      return null;
    }
  },

  // Buscar todos os cupons da loja
  async getStoreCoupons(storeId: string): Promise<DiscountCoupon[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const couponsQuery = query(
        collection(storeRef, 'discounts'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(couponsQuery);
      return querySnapshot.docs.map(couponDoc => {
        const data = couponDoc.data();
        return {
          id: couponDoc.id,
          ...data,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DiscountCoupon;
      });
    } catch (error) {
      console.error('Erro ao buscar cupons da loja:', error);
      return [];
    }
  },

  // Buscar cupons ativos da loja
  async getActiveStoreCoupons(storeId: string): Promise<DiscountCoupon[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const now = new Date();
      
      const couponsQuery = query(
        collection(storeRef, 'discounts'),
        where('isActive', '==', true),
        where('validUntil', '>=', now),
        orderBy('validUntil', 'asc')
      );

      const querySnapshot = await getDocs(couponsQuery);
      return querySnapshot.docs.map(couponDoc => {
        const data = couponDoc.data();
        return {
          id: couponDoc.id,
          ...data,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DiscountCoupon;
      });
    } catch (error) {
      console.error('Erro ao buscar cupons ativos:', error);
      return [];
    }
  },

  // Atualizar cupom
  async updateCoupon(storeId: string, couponId: string, updates: Partial<DiscountCoupon>): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const couponRef = doc(storeRef, 'discounts', couponId);
      
      await updateDoc(couponRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      throw new Error('Falha ao atualizar cupom');
    }
  },

  // Incrementar uso do cupom
  async incrementCouponUsage(storeId: string, couponId: string): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const couponRef = doc(storeRef, 'discounts', couponId);
      
      await updateDoc(couponRef, {
        usedCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao incrementar uso do cupom:', error);
      throw new Error('Falha ao incrementar uso');
    }
  },

  // Deletar cupom
  async deleteCoupon(storeId: string, couponId: string): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const couponRef = doc(storeRef, 'discounts', couponId);
      await deleteDoc(couponRef);
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      throw new Error('Falha ao deletar cupom');
    }
  },

  // Verificar se código já existe
  async isCodeUnique(storeId: string, code: string, excludeCouponId?: string): Promise<boolean> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      let couponsQuery;
      
      if (excludeCouponId) {
        couponsQuery = query(
          collection(storeRef, 'discounts'),
          where('code', '==', code.toUpperCase().trim()),
          where('__name__', '!=', excludeCouponId)
        );
      } else {
        couponsQuery = query(
          collection(storeRef, 'discounts'),
          where('code', '==', code.toUpperCase().trim())
        );
      }

      const querySnapshot = await getDocs(couponsQuery);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar unicidade do código:', error);
      return false;
    }
  },

  // Estatísticas de cupons
  async getCouponStats(storeId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
  }> {
    try {
      const coupons = await this.getStoreCoupons(storeId);
      const now = new Date();
      
      const activeCoupons = coupons.filter(c => 
        c.isActive && new Date(c.validUntil) >= now
      );
      
      const expiredCoupons = coupons.filter(c => 
        new Date(c.validUntil) < now
      );
      
      const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);

      return {
        total: coupons.length,
        active: activeCoupons.length,
        expired: expiredCoupons.length,
        totalUsage
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, active: 0, expired: 0, totalUsage: 0 };
    }
  }
};