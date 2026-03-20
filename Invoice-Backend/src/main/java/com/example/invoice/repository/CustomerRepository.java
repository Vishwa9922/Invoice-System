package com.example.invoice.repository;

import com.example.invoice.domain.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>
{
    Optional<Customer> findByMobileNumber(String mobileNumber);
    boolean existsByMobileNumber(String mobileNumber);
    Page<Customer> findByNameContainingIgnoreCaseOrMobileNumberContaining(
            String name, String mobile, Pageable pageable);
}
