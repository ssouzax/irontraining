import { DietProfileForm } from '@/components/DietProfileForm';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';

export default function DietPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Utensils className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Perfil de Dieta</h1>
          <p className="text-sm text-muted-foreground">
            Preencha suas informações para receber uma dieta personalizada
          </p>
        </div>
      </motion.div>

      <DietProfileForm />
    </div>
  );
}
